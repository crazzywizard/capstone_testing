import { ethers } from 'ethers';
import { create as ipfsHttpClient } from 'ipfs-http-client';
import Head from 'next/head';
import Image from 'next/image';
import styles from '../styles/Home.module.css';
import Web3Modal from 'web3modal';
import Alexa4Musicians_721 from '../src/contract/Alexa4Musicians_721.json';
import { useEffect, useState } from 'react';
import React from 'react';
import Button from '@material-tailwind/react/Button';
import { OnboardingButton } from '../src/Onboarding';
const client = ipfsHttpClient('https://ipfs.infura.io:5001/api/v0');
export default function Home() {
  const [onBoard, setOnBoard] = useState(false);
  const [provider, setProvider] = useState();
  const [web3Modal, setWeb3Modal] = useState();
  const [library, setLibrary] = useState();
  const [account, setAccount] = useState();
  const [error, setError] = useState('');
  const [chainId, setChainId] = useState();
  const [network, setNetwork] = useState();
  const [contract, setContract] = useState(null);
  const connectWallet = async () => {
    try {
      const web3Modal = new Web3Modal();
      const provider = provider ? provider : await web3Modal.connect();
      console.log(provider);
      const library = new ethers.providers.Web3Provider(provider);
      const accounts = await library.listAccounts();
      const network = await library.getNetwork();
      setProvider(provider);
      setLibrary(library);

      if (accounts) {
        setAccount(accounts[0]);
        setChainId(network.chainId);
      }
    } catch (error) {
      setError(error);
    }
  };
  useEffect(() => {
    async function listenMMAccount() {
      window.ethereum.on('accountsChanged', async function () {
        // Time to reload your interface with accounts[0]!
        await connectWallet();
      });
    }
    if (typeof window.ethereum !== 'undefined' || typeof window.web3 !== 'undefined') {
      listenMMAccount();
    }
  }, []);
  const handleNetwork = (e) => {
    const id = e.target.value;
    setNetwork(Number(id));
  };
  const refreshState = () => {
    setAccount();
    setChainId();
    setNetwork('');
  };
  useEffect(() => {
    (async () => {
      if (typeof window.ethereum !== 'undefined' || typeof window.web3 !== 'undefined') {
        // Web3 browser user detected. You can now use the provider.
        const provider = window['ethereum'] || window.web3.currentProvider;
        setProvider(provider);
        const library = new ethers.providers.Web3Provider(provider);
        setLibrary(library);
        const accounts = await library.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const signer = library.getSigner();
          const contract = new ethers.Contract(
            '0x812770C422D66476659cd2D0F2E0BC46ee68c0cc',
            Alexa4Musicians_721.abi,
            signer
          );
          setContract(contract);
        } else {
          window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x13881',
                rpcUrls: [
                  'https://polygon-mumbai.g.alchemy.com/v2/ILaQRSx7P94pGGYyJmF_3iqxdnQgxxI-'
                ],
                chainName: 'Mumbai',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                blockExplorerUrls: ['https://polygonscan.com/']
              }
            ]
          });
        }
      } else {
        setOnBoard(true);
        console.log('No metamask installed');
      }
    })();
  }, [onBoard]);
  const disconnect = async () => {
    await web3Modal.clearCachedProvider();
    refreshState();
  };
  const contract_init = async () => {
    const signer = library.getSigner();
    const contract = new ethers.Contract(
      '0x812770C422D66476659cd2D0F2E0BC46ee68c0cc',
      Alexa4Musicians_721.abi,
      signer
    );
    return contract;
  };
  const isSkillMinted = async (skillId) => {
    try {
      const contract = contract ? contract : await contract_init();
      return contract.isSkillMinted(skillId);
    } catch (e) {
      console.error(e);
    }
  };
  const getMintedData = async (skillId) => {
    try {
      const contract = contract ? contract : await contract_init();
      return contract.getArtistsData(skillId);
    } catch (e) {
      console.error(e);
    }
  };
  const mint = async (e) => {
    e.preventDefault();
    try {
      const skillId = 'amzn1.ask.skill.7fcc72bb-d801-406f-bfb1-deac1c2f2fbc';
      if (await isSkillMinted(skillId)) {
        console.log(await getMintedData(skillId));
      } else {
        const contract = await contract_init();
        const url = `https://gateway.pinata.cloud/ipfs/QmRkY9ea98cFAesrV5eYScqMfaMYB2nsYMUzcUdRJhYnvn`;
        let fee = await contract.getMaticFee(true);
        const data = JSON.stringify({
          name: 'sameer_alexa_skill',
          description: 'alexa skill created by sameer',
          image: url,
          attributes: [{ trait_type: 'Skill_Id', value: skillId }]
        });
        const added = await client.add(data);
        const ipfsURL = `https://ipfs.infura.io/ipfs/${added.path}`;
        try {
          let trans = await contract.mint(ipfsURL, skillId, true, {
            value: fee.toString()
          });

          let tx = await trans.wait();
        } catch (e) {
          console.log('error', e.data.message);
        }
      }
    } catch (err) {
      console.error('Error', err);
    }
  };
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <link rel="icon" href="/favicon.ico" />
        {/* Material Icons Link */}
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        {/* Font Awesome Link */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.2/css/all.min.css"
          integrity="sha512-HK5fgLBL+xu6dm/Ii3z4xhlSUyZgTT9tuc/hSrtw6uzJOvgRr2a9jyxxT1ely+B+xFAmJKVSTbpM/CuL7qxO8w=="
          crossOrigin="anonymous"
        />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>
        {onBoard ? (
          <OnboardingButton setOnBoard={setOnBoard} />
        ) : !account ? (
          <Button color="blueGray" ripple="light" onClick={connectWallet}>
            Connect Wallet
          </Button>
        ) : (
          <Button color="lightBlue" ripple="light" onClick={mint}>
            Mint
          </Button>
        )}
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <span className={styles.logo}>
            <Image src="/vercel.svg" alt="Vercel Logo" width={72} height={16} />
          </span>
        </a>
      </footer>
    </div>
  );
}
