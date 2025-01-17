import React, { useState } from "react";
import { Magic } from "magic-sdk";
import { ConnectExtension } from "@magic-ext/connect";
import Web3 from "web3";
import { onUpdateUser } from "@redux/actions";
import { networkConfigs } from "@shared/helpers/networks";

const getMagicConfig = (networkId: any) => {
  const network = networkConfigs[networkId];
  return {
    rpcUrl: network["rpc"],
    chainId: networkId,
  };
};

export default function useMagicLink(networkId: number = 137) {
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState<any>(null);
  const [web3, setWeb3] = useState<any>(null);
  const [provider, setProvider] = useState<any>(null);
  const [magic, setMagic] = useState<any>(null);
  const [email, setEmail] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<any>(false);

  const [user, setUser] = React.useState(null);

  if (
    typeof window !== "undefined" &&
    magic == null &&
    process.env.NEXT_PUBLIC_MAGIC_KEY
  ) {
    // Client-side-only code
    const key = process.env.NEXT_PUBLIC_MAGIC_KEY
      ? process.env.NEXT_PUBLIC_MAGIC_KEY
      : "";

    const chainId = process.env.NEXT_PUBLIC_CHAIN_ID
      ? process.env.NEXT_PUBLIC_CHAIN_ID
      : 80001;

    const magic: any = new Magic(key, {
      network: getMagicConfig(chainId),
      locale: "en_US",
      extensions: [new ConnectExtension()],
    });
    setMagic(magic);
    setProvider(magic.rpcProvider);
    setWeb3(new Web3(magic.rpcProvider));
  }

  const showWallet = () => {
    magic.connect.showWallet().catch((e: any) => {
      console.log(e);
    });
  };

  // React.useEffect(() => {
  //   if (
  //     typeof window !== "undefined" &&
  //     magic == null &&
  //     process.env.NEXT_PUBLIC_MAGIC_KEY
  //   ) {
  //     const key = process.env.NEXT_PUBLIC_MAGIC_KEY
  //       ? process.env.NEXT_PUBLIC_MAGIC_KEY
  //       : "";

  //     console.log(getMagicConfig(networkId), "lamama");

  //     const magic: any = new Magic(key, {
  //       network: getMagicConfig(networkId),
  //       locale: "en_US",
  //       extensions: [new ConnectExtension()],
  //     });
  //     console.log(magic);
  //     setMagic(magic);
  //     setProvider(magic.rpcProvider);
  //     setWeb3(new Web3(magic.rpcProvider));
  //   }
  // }, [networkId]);

  const sendTransaction = async () => {
    const publicAddress = (await web3.eth.getAccounts())[0];
    const txnParams = {
      from: publicAddress,
      to: publicAddress,
      value: web3.utils.toWei("0.01", "ether"),
      gasPrice: web3.utils.toWei("30", "gwei"),
    };
    web3.eth
      .sendTransaction(txnParams as any)
      .on("transactionHash", (hash: any) => {
        console.log("the txn hash that was returned to the sdk:", hash);
      })
      .then((receipt: any) => {
        console.log("the txn receipt that was returned to the sdk:", receipt);
      })
      .catch((error: any) => {
        console.log(error);
      });
  };

  const login = async (dispatch: any) => {
    console.log("login");
    setLoading(true);
    try {
      const publicAddress = (await web3.eth.getAccounts())[0];
      setAccount(publicAddress);
      setIsAuthenticated(true);
      // const email = await magic.connect.requestUserInfo();
      // setEmail(email);
      console.log(publicAddress);
      dispatch(
        onUpdateUser({
          ethAddress: publicAddress,
          email,
          provider: provider,
          providerName: "magic",
        }),
      );
    } catch (error) {
      console.log(error, "aqui");
    }
    setLoading(false);
  };

  const logout = async (dispatch: any) => {
    setLoading(true);
    await magic.connect.disconnect().catch((e: any) => {
      console.log(e);
    });
    setIsAuthenticated(false);
    setAccount(null);
    dispatch(
      onUpdateUser({
        ethAddress: "",
        providerName: "",
        email: "",
        provider: undefined,
      }),
    );
    setLoading(false);
  };

  React.useEffect(() => {
    if (account != null) {
      setUser({
        get: (attr: string) => {
          return user[attr];
        },
        ethAddress: account,
        email: email,
        name: "",
        logged: true,
      });
    } else {
      setUser(null);
    }
    console.log(email, account, isAuthenticated);
  }, [email, account, isAuthenticated]);

  return {
    loading,
    login,
    sendTransaction,
    account,
    magic,
    appKey: process.env.NEXT_PUBLIC_MAGIC_KEY,
    isInitialized: magic !== null,
    logout,
    isAuthenticated,
    // isUnauthenticated: account == null,
    // setUserData,
    user,
    // _setUser: (user: MoralisType.User) => void;
    // userError: null | Error;
    // isUserUpdating: boolean;
    // refetchUserData: () => Promise<MoralisType.User | undefined>;
    // enableWeb3: (options?: Web3EnableOptions) => Promise<MoralisType.Web3Provider | undefined>;
    // deactivateWeb3: () => Promise<void>;
    showWallet,
    web3,
    isWeb3Enabled: web3 !== undefined,
    // web3EnableError: Error | null;
    // isWeb3EnableLoading: boolean;
    // chainId;
    // account;
    // network;
    // connector;
    // connectorType;
    provider: provider,
  };
}
