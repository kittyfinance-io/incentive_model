import { Web3Provider as Web3ProviderEthers } from '@ethersproject/providers';
import React, { createContext, useContext, useReducer } from 'react';

interface Web3State {
  instance: any;
  provider: Web3ProviderEthers | undefined;
  account: string | undefined | null;
  chainId: number | undefined;
  dispatch?: React.Dispatch<ActionType>;
}

type ActionType =
  | {
      type: 'SET_WEB3';
      instance: Web3State['instance'];
      provider: Web3State['provider'];
      account: Web3State['account'];
      chainId: Web3State['chainId'];
    }
  | { type: 'SET_ACCOUNT'; account: Web3State['account'] }
  | { type: 'SET_CHAINID'; chainId: Web3State['chainId'] }
  | { type: 'RESET_WEB3' };

const initialWeb3State = {} as Web3State;

const Web3Context = createContext<Web3State>(initialWeb3State);

export const useWeb3 = () => useContext(Web3Context);

function reducer(state: Web3State, action: ActionType): Web3State {
  switch (action.type) {
    case 'SET_WEB3':
      return {
        ...state,
        instance: action.instance,
        provider: action.provider,
        account: action.account,
        chainId: action.chainId,
      };
    case 'SET_ACCOUNT':
      return {
        ...state,
        account: action.account,
      };
    case 'SET_CHAINID':
      return {
        ...state,
        chainId: action.chainId,
      };
    case 'RESET_WEB3':
    default:
      return initialWeb3State;
  }
}

interface IProps {
  children?: React.ReactNode;
}

export const Web3Provider: React.FC<IProps> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialWeb3State);

  return <Web3Context.Provider value={{ ...state, dispatch }}>{children}</Web3Context.Provider>;
};

export default Web3Context;
