import { NETWORKS } from "config/network";
import { ethers } from "ethers";
import Web3 from "web3";

// import { Web3Provider } from '@ethersproject/providers';

const defaultEthereumConfig = {
  testing: false,
  autoGasMultiplier: 1.5,
  defaultConfirmations: 3,
  defaultGas: "6000000",
  defaultGasPrice: "7000000000000",
  ethereumNodeTimeout: 10000,
};

function web3ProviderFrom(endpoint: string): any {
  const ethConfig = Object.assign(defaultEthereumConfig);

  const providerClass = endpoint.includes("wss")
    ? Web3.providers.WebsocketProvider
    : Web3.providers.HttpProvider;

  return new providerClass(endpoint, {
    timeout: ethConfig.ethereumNodeTimeout,
  });
}

export function getProvider(chainId: number): ethers.providers.Web3Provider {
  const network = NETWORKS.filter((item) => item.chainId === chainId)[0];
  const provider: ethers.providers.Web3Provider =
    new ethers.providers.Web3Provider(
      web3ProviderFrom(network.defaultProvider[0]),
      chainId
    );
  return provider;
}
