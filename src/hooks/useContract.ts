import { Contract } from "@ethersproject/contracts";
import { Web3Provider as Web3ProviderEthers } from "@ethersproject/providers";
import { useMemo } from "react";
import { useWeb3 } from "state/web3";
import { getContract } from "utils";

export function useContract(
  provider: Web3ProviderEthers | undefined,
  chainId: number,
  addressOrAddressMap: string | { [chainId: number]: string } | undefined,
  ABI: { [chainId: number]: any } | any,
  withSignerIfPossible = true
): Contract | null {
  const { account } = useWeb3();
  return useMemo(() => {
    if (!addressOrAddressMap || !ABI || !provider || !chainId) return null;
    let address: string | undefined;
    if (typeof addressOrAddressMap === "string") address = addressOrAddressMap;
    else address = addressOrAddressMap[chainId];
    if (!address) return null;
    let abi: any;
    if (!Array.isArray(ABI) && Object.keys(ABI).length > 0) abi = ABI[chainId];
    else abi = ABI;
    if (!abi) return null;
    try {
      return getContract(
        address,
        abi,
        provider,
        withSignerIfPossible && account ? account : undefined
      );
    } catch (error) {
      console.error("Failed to get contract", error);
      return null;
    }
  }, [addressOrAddressMap, ABI, provider, chainId, withSignerIfPossible]);
}

