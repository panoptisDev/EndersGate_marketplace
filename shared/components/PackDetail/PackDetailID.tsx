import React from "react";
import {
  LeftCircleFilled,
  LeftOutlined,
  LoadingOutlined,
} from "@ant-design/icons";
import { useRouter } from "next/router";
import Web3 from "web3";

import { useAppDispatch, useAppSelector } from "redux/store";
import { onSellERC1155, onLoadSales, onGetAssets } from "@redux/actions";
import { Button } from "../common/button/button";
import { Icons } from "@shared/const/Icons";
import {
  getAddresses,
  getContractCustom,
  getTokensAllowed,
} from "@shared/web3";
import { Typography } from "../common/typography";
import packs from "../../packs.json";
import { useModal } from "@shared/hooks/modal";
import { approveERC1155 } from "@shared/web3";
import { Images } from "@shared/const/Images";
import Styles from "../NFTDetail/styles.module.scss";
import clsx from "clsx";
import Tilt from "react-parallax-tilt";
import useMagicLink from "@shared/hooks/useMagicLink";
import { useWeb3React } from "@web3-react/core";
import { AddressText } from "../common/specialFields/SpecialFields";
import { CHAINS } from "../chains";

const PackDetailIDComponent: React.FC<any> = ({ id, inventory }) => {
  const { account: user, provider } = useWeb3React();
  const NFTs = useAppSelector((state) => state.nfts);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [message, setMessage] = React.useState(
    "You will have to make two transactions (if you haven't approved us before, instead you will get one). The first one to approve us to have listed your tokens and the second one to list the tokens",
  );

  const [sellNFTData, setSellNFTData] = React.useState({
    startingPrice: 0,
    amount: 0,
    duration: 0,
  });

  const [tokensSelected, setTokensSelected] = React.useState([]);

  const { Modal, show, hide, isShow } = useModal();
  const { pack } = getAddresses();

  const sellNft = async () => {
    console.log(NFTs.balanceCards, id);
    if (sellNFTData.amount > NFTs.balancePacks[id]?.balance) {
      return alert("You don't have enough tokens to sell");
    }
    if (sellNFTData.amount < 1) {
      return alert("You have to put more than 1 NFT to sell");
    }
    if (sellNFTData.startingPrice <= 0) {
      return alert("You have to put a valid sell price");
    }
    if (sellNFTData.duration <= 3600 * 24) {
      return alert("You have to put a end date higher than 1 day");
    }
    if (tokensSelected.length == 0) {
      return alert("You have to put at least one currency to accept");
    }
    try {
      const tokenId = id;
      const { pack, marketplace } = getAddresses();
      const endersgateInstance = getContractCustom(
        "EndersPack",
        pack,
        provider.provider,
      );

      const isApprovedForAll = await endersgateInstance.methods
        .isApprovedForAll(user, marketplace)
        .call();
      if (isApprovedForAll == false) {
        setMessage("Allowing us to sell your tokens");
        await approveERC1155({
          provider: provider.provider,
          from: user,
          to: marketplace,
          address: pack,
        });
      }
      setMessage("Listing your tokens");

      await dispatch(
        onSellERC1155({
          address: pack,
          from: user,
          startingPrice: (sellNFTData.startingPrice * 10 ** 6).toString(),
          amount: sellNFTData.amount,
          tokenId: tokenId,
          tokens: tokensSelected,
          duration: sellNFTData.duration.toString(),
          provider: provider.provider,
          // user: user,
        }),
      );
    } catch (err) {
      console.log({ err }, "error mamawebo");
    }

    dispatch(onLoadSales());
    dispatch(onGetAssets(user));
    setMessage(
      "You will have to make two transactions (if you haven't approved us before, instead you will get one). The first one to approve us to have listed your tokens and the second one to list the tokens",
    );
    hide();
    setSellNFTData({
      startingPrice: 0,
      amount: 0,
      duration: 0,
    });
  };

  React.useEffect(() => {
    console.log("nft data", sellNFTData);
  }, [sellNFTData]);

  React.useEffect(() => {
    setTokensSelected(getTokensAllowed().map((item) => item.address));
  }, []);

  const tokensAllowed = getTokensAllowed();

  return (
    <>
      <Modal isShow={isShow} withoutX>
        {id ? (
          <div className="flex flex-col items-center gap-4 bg-secondary rounded-md p-8 max-w-xl">
            <h2 className="font-bold text-primary text-center">Sell NFT</h2>
            <div className="flex md:flex-row flex-col md:gap-16 gap-4 w-full items-center">
              <Tilt>
                <div className="h-auto w-auto">
                  <img
                    src={packs[id]?.properties?.image?.value}
                    className={clsx(Styles.animatedImage)}
                    alt=""
                  />
                </div>
              </Tilt>
              <div
                className="flex flex-col gap-4 justify-between md:w-64"
                style={{ maxWidth: "100vw" }}
              >
                <div className="flex flex-col gap-4 w-full justify-center items-center">
                  <label className="text-primary font-medium">
                    Starting price for each NFT (ONE)
                  </label>
                  <input
                    type="number"
                    className="bg-overlay text-primary text-center"
                    value={sellNFTData.startingPrice}
                    min={0}
                    onChange={(e) => {
                      setSellNFTData((prev: any) => {
                        return { ...prev, startingPrice: e.target.value };
                      });
                    }}
                  />
                </div>
                <div className="flex flex-col gap-4 w-full justify-center items-center">
                  <label className="text-primary font-medium">
                    Amount of NFTs
                  </label>
                  <input
                    type="number"
                    className="bg-overlay text-primary text-center"
                    value={sellNFTData.amount}
                    min={1}
                    onChange={(e) => {
                      setSellNFTData((prev: any) => {
                        return { ...prev, amount: parseInt(e.target.value) };
                      });
                    }}
                  />
                </div>
                <div className="flex flex-col gap-4 w-full justify-center items-center">
                  <label className="text-primary font-medium">End Date</label>
                  <input
                    type="date"
                    className="bg-overlay text-primary text-center"
                    onChange={(e) => {
                      const date = new Date(e.target.value + " 00:00");
                      setSellNFTData((prev: any) => {
                        return {
                          ...prev,
                          duration:
                            Math.floor(date.getTime() / 1000) -
                            Math.floor(new Date().getTime() / 1000),
                        };
                      });
                    }}
                  />
                </div>
                <div className="py-6">
                  <div className="text-primary text-sm text-center flex flex-col items-center justify-center">
                    {message ===
                    "You will have to make two transactions (if you haven't approved us before, instead you will get one). The first one to approve us to have listed your tokens and the second one to list the tokens" ? (
                      message
                    ) : (
                      <>
                        <span className="flex gap-4 items-center justify-center">
                          {message}
                        </span>
                        <LoadingOutlined />
                        <span className="flex gap-4 mt-6 items-center justify-center">
                          {message === "Listing your tokens"
                            ? "Transaction 2/2"
                            : "Transaction 1/2"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-row flex-col gap-4 w-full justify-center items-center">
                  <Button
                    // className="px-4 py-2 border border-primary text-primary"
                    decoration="line-primary"
                    className="hover:text-white border-primary"
                    size="small"
                    onClick={() => {
                      hide();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    // className="px-4 py-2 border border-primary text-primary"
                    decoration="fillPrimary"
                    className="degradated hover:text-white border-none"
                    size="small"
                    onClick={sellNft}
                  >
                    List NFT/s
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          ""
        )}
      </Modal>
      {id !== undefined ? (
        <div className="min-h-screen w-full flex flex-col xl:px-36 md:px-10 sm:px-6 px-4 pt-20 pb-20">
          <div
            className="flex w-full text-lg items-center gap-2 text-white"
            onClick={() => router.back()}
          >
            <div className="flex items-center gap-2 cursor-pointer w-min">
              <LeftCircleFilled className="w-8 h-8" />
            </div>
          </div>

          <div className="w-full flex xl:flex-row flex-col gap-4 justify-center">
            <div className="flex flex-col gap-2">
              <div className="flex relative items-center justify-center xl:min-w-[500px] min-w-[320px] min-h-[675px] py-10 xl:px-24 rounded-md bg-secondary cursor-pointer relative overflow-hidden border border-gray-500">
                <img
                  src={packs[id].properties.image?.value}
                  className="absolute xl:top-[-20%] top-[-25%] bottom-0 xl:left-[-55%] left-[-35%] right-0 margin-auto opacity-50 xl:min-w-[1050px] min-w-[175%]"
                  alt=""
                />
                <Tilt className="flex items-center justify-center">
                  <div className="sm:sticky sm:top-32 h-min w-auto">
                    <img
                      src={packs[id].properties.image?.value || Icons.logo}
                      className={clsx(Styles.animatedImageMain)}
                      alt=""
                    />
                  </div>
                </Tilt>
              </div>
            </div>
            <div className="flex flex-col xl:w-[500px] gap-6 w-full py-10">
              <div className="flex flex-col  w-full">
                <div className="flex flex-col">
                  <h1 className="text-primary uppercase md:text-4xl text-3xl font-bold">
                    {packs[id]?.properties?.name?.value}
                  </h1>
                  <div className="flex flex-col md:px-6 md:py-10 p-2 border border-overlay-border bg-secondary rounded-xl mt-4 relative">
                    <p className="absolute md:top-4 md:right-6 top-2 right-4 text-overlay-border text-sm">
                      SELL PANEL
                    </p>

                    <div className="flex flex-row xl:gap-32 gap-16 w-full">
                      <div className="flex flex-col gap-4 w-full items-center px-8">
                        <div className="flex gap-4 w-full justify-between items-center">
                          <label className="text-primary font-bold whitespace-nowrap">
                            Price NFT
                          </label>
                          <input
                            type="number"
                            className="bg-overlay text-primary text-center w-16 p-1 font-bold rounded-xl border border-overlay-border"
                            value={sellNFTData.startingPrice}
                            min={0}
                            onChange={(e) => {
                              setSellNFTData((prev: any) => {
                                return {
                                  ...prev,
                                  startingPrice: e.target.value,
                                };
                              });
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-2 w-full justify-between items-center">
                          <div className="flex gap-4 w-full justify-between items-center">
                            {" "}
                            <label className="text-primary font-bold whitespace-nowrap">
                              Amount of NFTs
                            </label>
                            <input
                              type="number"
                              className="bg-overlay text-primary text-center w-16 p-1 font-bold rounded-xl border border-overlay-border"
                              value={sellNFTData.amount}
                              min={1}
                              onChange={(e) => {
                                setSellNFTData((prev: any) => {
                                  return {
                                    ...prev,
                                    amount: parseInt(e.target.value),
                                  };
                                });
                              }}
                            />
                          </div>
                          {sellNFTData.amount >
                            NFTs?.balancePacks[id]?.balance && (
                            <Typography
                              type="caption"
                              className="text-red-primary"
                            >
                              The amount can't be higher than your balance
                            </Typography>
                          )}
                        </div>
                        <div className="flex  gap-4 w-full justify-between items-center">
                          <label className="text-primary font-bold whitespace-nowrap">
                            End Date
                          </label>
                          <input
                            type="date"
                            className="bg-overlay text-primary text-center w-30 p-1 font-bold rounded-xl border border-overlay-border"
                            onChange={(e) => {
                              const date = new Date(e.target.value + " 00:00");
                              setSellNFTData((prev: any) => {
                                return {
                                  ...prev,
                                  duration:
                                    Math.floor(date.getTime() / 1000) -
                                    Math.floor(new Date().getTime() / 1000),
                                };
                              });
                            }}
                          />
                        </div>
                        <div className="text-[11px] w-full text-left text-white font-bold">
                          Select at least 1 currency you want to accept as a
                          payment for this listing
                        </div>
                        <div className="flex  gap-4 w-full flex-wrap items-center justify-center">
                          {tokensAllowed.map((item, index) => {
                            return (
                              <div
                                className={clsx(
                                  "w-28 text-[14px] flex items-center justify-center border gap-2 rounded-full cursor-pointer p-2",
                                  {
                                    "bg-overlay-border border-none":
                                      !tokensSelected.includes(item.address),
                                  },
                                  {
                                    "bg-overlay border-green-button shadow-[0_0px_10px] shadow-green-button":
                                      tokensSelected.includes(item.address),
                                  },
                                )}
                                onClick={() => {
                                  if (tokensSelected.includes(item.address)) {
                                    setTokensSelected((prev) =>
                                      prev.filter(
                                        (itemNew) => item.address !== itemNew,
                                      ),
                                    );
                                  } else {
                                    setTokensSelected((prev) => {
                                      const newArray = [];
                                      prev.forEach((item2) =>
                                        newArray.push(item2),
                                      );
                                      newArray.push(item.address);
                                      return newArray;
                                    });
                                  }
                                }}
                              >
                                <img
                                  src={item.logo}
                                  className="w-6 h-6"
                                  alt=""
                                />
                                <h2 className="text-white text-md font-bold">
                                  {item.name}
                                </h2>
                              </div>
                            );
                          })}
                        </div>
                        <div className="py-6">
                          <div className="text-primary text-[12px] text-center flex flex-col items-center justify-center">
                            {message ===
                            "You will have to make two transactions (if you haven't approved us before, instead you will get one). The first one to approve us to have listed your tokens and the second one to list the tokens" ? (
                              <span className="text-left w-full">
                                <span className="font-bold">Note:</span>{" "}
                                {message}
                              </span>
                            ) : (
                              <>
                                <span className="flex gap-4 items-center justify-center">
                                  {message} <LoadingOutlined />
                                </span>
                                <span className="flex gap-4 mt-6 items-center justify-center">
                                  {message === "Listing your tokens" &&
                                    "Last Transaction"}
                                  {message ===
                                    "Allowing us to sell your tokens" &&
                                    "Transaction 1/2"}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          decoration="fill"
                          className="md:w-48 w-32 md:text-lg text-md py-[6px] rounded-lg text-overlay !bg-green-button hover:!bg-secondary hover:!text-green-button hover:!border-green-button"
                          onClick={sellNft}
                        >
                          Sell Now
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-4 py-2 border border-overlay-border bg-secondary rounded-xl mt-4 relative">
                  <p className="absolute top-2 right-4 text-overlay-border text-[11px]">
                    TOKEN INFO
                  </p>
                  <div className="flex flex-col w-full">
                    <h2 className="text-white font-bold text-lg border-b border-overlay-border pb-2 px-6">
                      Token Details:
                    </h2>
                    <div className="w-full flex justify-between py-2 border-b border-overlay-border px-6">
                      <p className="text-lg font-[400] text-primary-disabled ">
                        Blockchain:
                      </p>
                      <p className="text-primary-disabled  font-[400] text-lg">
                        {CHAINS[process.env.NEXT_PUBLIC_CHAIN_ID].name}
                      </p>
                    </div>
                    <div className="w-full flex justify-between py-2 border-b border-overlay-border px-6">
                      <p className="text-lg font-[400] text-primary-disabled ">
                        Token ID:
                      </p>
                      <p className="text-primary-disabled  font-[400] text-lg">
                        {id}
                      </p>
                    </div>
                    <div className="w-full flex justify-between py-2 border-b border-overlay-border px-6">
                      <p className="text-lg font-[400] text-primary-disabled ">
                        Balance:
                      </p>
                      <p className="text-primary-disabled  font-[400] text-lg">
                        {NFTs?.balancePacks[id]?.balance}
                      </p>
                    </div>
                    <div className="w-full flex justify-between py-2 border-b border-overlay-border px-6">
                      <p className="text-lg font-[400] text-primary-disabled ">
                        Token Standard:
                      </p>
                      <p className="text-primary-disabled  font-[400] text-lg">
                        ERC1155
                      </p>
                    </div>
                    <div className="w-full flex justify-between py-2 border-b border-overlay-border px-6">
                      <p className="text-lg font-[400] text-primary-disabled ">
                        Contract:
                      </p>
                      <a
                        href={
                          CHAINS[process.env.NEXT_PUBLIC_CHAIN_ID]
                            .blockExplorer +
                          "/address/" +
                          pack
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="text-red-primary font-[400] text-lg flex items-center gap-1"
                      >
                        <AddressText text={pack}></AddressText>{" "}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-6 h-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                          />
                        </svg>
                      </a>
                    </div>
                    <div className="w-full flex justify-between py-2 border-b border-overlay-border px-6">
                      <p className="text-lg font-[400] text-primary-disabled ">
                        Partner Royalty:
                      </p>
                      <p className="text-primary-disabled font-[400] text-lg">
                        0%
                      </p>
                    </div>
                    <div className="w-full flex justify-between pt-2 px-6">
                      <p className="text-lg font-[400] text-primary-disabled ">
                        5HG Fee:
                      </p>
                      <p className="text-primary-disabled font-[400] text-lg">
                        4%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-screen w-screen bg-overlay flex items-center justify-center text-3xl text-primary">
          <LoadingOutlined />
        </div>
      )}
    </>
  );
};

export default PackDetailIDComponent;
