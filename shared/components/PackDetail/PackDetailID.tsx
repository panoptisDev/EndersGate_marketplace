import React from "react";
import { LeftOutlined, LoadingOutlined } from "@ant-design/icons";
import { useRouter } from "next/router";
import Web3 from "web3";
import { useMoralis } from "react-moralis";

import { useAppDispatch, useAppSelector } from "redux/store";
import { onSellERC1155, onLoadSales } from "@redux/actions";
import { Button } from "../common/button/button";
import { Icons } from "@shared/const/Icons";
import { getAddresses } from "@shared/web3";
import { Typography } from "../common/typography";
import cards from "../../cards.json";
import packs from "../../packs.json";
import { useModal } from "@shared/hooks/modal";
import { approveERC1155 } from "@shared/web3";
import { Images } from "@shared/const/Images";


const PackDetailIDComponent: React.FC<any> = ({ id, inventory }) => {
  const { user, Moralis, web3 } = useMoralis();
  const NFTs = useAppSelector((state) => state.nfts);
  const router = useRouter();
  const dispatch = useAppDispatch();

  const [message, setMessage] = React.useState(
    "You will have to make two transactions. The first one to approve us to have listed your tokens and the second one to list the tokens"
  );

  const [sellNFTData, setSellNFTData] = React.useState({
    startingPrice: 0,
    amount: 0,
  });

  const { Modal, show, hide, isShow } = useModal();

  const sellNft = async () => {
    if (sellNFTData.amount > NFTs.balancePacks[id].balance) {
      return alert("You don't have enough packs to sell");
    }
    const tokenId = id;
    setMessage("Allowing us to sell your packs");
    const { pack, marketplace } = getAddresses();
    const userAddress = user.get("ethAddress");
    console.log("marketplace", marketplace);
    await approveERC1155({
      provider: web3,
      from: userAddress,
      to: marketplace,
      address: pack,
    });
    setMessage("Listing your packs");
    await dispatch(
      onSellERC1155({
        address: pack,
        from: userAddress,
        startingPrice: Web3.utils.toWei(sellNFTData.startingPrice.toString()),
        amount: sellNFTData.amount,
        tokenId: tokenId,
        duration: (3600 * 24 * 30).toString(),
        moralis: Moralis,
      })
    );
    await dispatch(onLoadSales());
    setMessage(
      "You will have to make two transactions. The first one to approve us to have listed your tokens and the second one to list the tokens"
    );
    hide();
  };

  React.useEffect(() => {
    console.log("nft data", sellNFTData);
  }, [sellNFTData]);

  return (
    <>
      <Modal isShow={isShow} withoutX>
        <div className="flex flex-col items-center gap-4 bg-secondary rounded-md p-8 max-w-xl">
          <h2 className="font-bold text-primary text-center">Sell NFT</h2>
          <div className="flex sm:flex-row flex-col gap-4 w-full justify-end items-center">
            <label className="text-primary font-medium">
              Starting price for each Pack (ONE)
            </label>
            <input
              type="number"
              className="bg-overlay text-primary text-center"
              onChange={(e) => {
                setSellNFTData((prev: any) => {
                  return { ...prev, startingPrice: e.target.value };
                });
              }}
            />
          </div>
          <div className="flex sm:flex-row flex-col gap-4 w-full justify-end items-center">
            <label className="text-primary font-medium">Amount of Packs</label>
            <input
              type="number"
              className="bg-overlay text-primary text-center"
              onChange={(e) => {
                setSellNFTData((prev: any) => {
                  return { ...prev, amount: e.target.value };
                });
              }}
            />
          </div>
          <div className="py-6">
            <div className="text-primary text-sm text-center flex items-center justify-center">
              {message ===
              "You will have to make two transactions. The first one to approve us to have listed your tokens and the second one to list the tokens" ? (
                message
              ) : (
                <span className="flex gap-4 items-center justify-center">
                  {message} <LoadingOutlined />
                </span>
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
              List Pack/s
            </Button>
          </div>
        </div>
      </Modal>
      {id ? (
        <div className="min-h-screen w-full flex flex-col xl:px-20 md:px-10 sm:px-6 pt-32 pb-20">
          <div className="flex sm:flex-row flex-col sm:justify-between  w-full">
            <div className="flex flex-col gap-2">
              <div
                className="cursor-pointer text-white flex font-bold items-center gap-1"
                onClick={() => router.back()}
              >
                <LeftOutlined />
                Back
              </div>
              <Typography type="title" className="text-primary">
                Pack #{id}
              </Typography>
              {/* <Typography type="title" className="text-primary">
                Transaction #{id}
              </Typography> */}
            </div>
            <div className="flex gap-2 items-start sm:mt-0 mt-4 sm:justify-end justify-between">
              {NFTs.balancePacks[id] && NFTs.balancePacks[id].balance && (
                <Button
                  decoration="fillPrimary"
                  className="degradated hover:text-white border-none"
                  size="small"
                  onClick={() => show()}
                >
                  <img
                    src={Icons.harmony}
                    className="h-6 w-6 rounded-full mr-2"
                    alt=""
                  />{" "}
                  Sell now
                </Button>
              )}
            </div>
          </div>
          <div className="w-full flex md:flex-row flex-col mt-10">
            <div className="flex relative justify-center md:w-1/2 xl:px-24">
              <div className="sm:sticky sm:top-32 h-min w-72">
                <img
                  src={
                    id == 0
                      ? Images.pack1
                      : id == 1
                      ? Images.pack2
                      : id == 2
                      ? Images.pack3
                      : Images.pack4
                  }
                  className="w-72"
                  alt=""
                />
              </div>
            </div>
            <div className="flex flex-col md:w-1/2">
              <div className="flex flex-col">
                <Typography type="title" className="text-primary font-bold">
                  About
                </Typography>
                <div className="flex flex-col gap-4 px-10 py-6 border border-primary rounded-xl mt-4">
                  <div className="flex flex-row gap-4">
                    <div className="flex flex-col">
                      <Typography
                        type="subTitle"
                        className="text-white font-bold"
                      >
                        NAME
                      </Typography>
                      <Typography
                        type="subTitle"
                        className="text-primary opacity-75"
                      >
                        {packs[id].properties.name.value}
                      </Typography>
                    </div>
                  </div>
                  <div>
                    <div className="flex flex-col">
                      <Typography
                        type="subTitle"
                        className="text-white font-bold"
                      >
                        DESCRIPTION
                      </Typography>
                      <Typography
                        type="subTitle"
                        className="text-primary opacity-75"
                      >
                        {packs[id].properties.description.value}
                      </Typography>
                    </div>
                  </div>
                  {NFTs.balancePacks[id] && NFTs.balancePacks[id].balance && (
                    <div>
                      <div className="flex flex-col">
                        <Typography
                          type="subTitle"
                          className="text-white font-bold"
                        >
                          YOUR BALANCE
                        </Typography>
                        <Typography
                          type="subTitle"
                          className="text-primary opacity-75"
                        >
                          {NFTs.balancePacks[id].balance}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </>
  );
};

export default PackDetailIDComponent;