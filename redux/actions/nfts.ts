import { createAsyncThunk } from "@reduxjs/toolkit";
import Web3 from "web3";

import * as actionTypes from "../constants";
import {
  getAddresses,
  getContract,
  getContractCustom,
  createEvent,
  getTokensAllowed,
} from "@shared/web3";
import cards from "../../cards.json";

const getCardSold = (successfulSales: Sale[]) => {
  return successfulSales.reduce(
    (acc, cur) => acc.add(Web3.utils.toBN(cur.amount)),
    Web3.utils.toBN(0),
  );
};

const getDailyVolume = (successfulSales: Sale[]) => {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);

  return successfulSales.reduce((acc, cur) => {
    const started = new Date(Number(cur.startedAt) * 1000).getTime();
    return acc.add(
      started > startOfDay.getTime() && started < endOfDay.getTime()
        ? Web3.utils.toBN(cur.price)
        : Web3.utils.toBN(0),
    );
  }, Web3.utils.toBN(0));
};

export const onLoadSales = createAsyncThunk(
  actionTypes.GET_LISTED_NFTS,
  async function prepare() {
    const addresses = getAddresses();
    const marketplace = getContract("ClockSale", addresses.marketplace);
    const lastSale = Number(await marketplace.methods.tokenIdTracker().call());
    const rawSales = await marketplace.methods
      .getSales(new Array(lastSale).fill(0).map((a, i) => i))
      .call();
    console.log(rawSales, "a ver");
    const allSales = rawSales.map((sale: string[], i) => ({
      id: i,
      seller: sale[0],
      nft: sale[1],
      nftId: sale[2],
      amount: sale[3],
      price: sale[4],
      tokens: sale[5],
      duration: sale[6],
      startedAt: sale[7],
      status: sale[8],
    }));
    console.log(allSales, "ALL SALES");
    const created = allSales.filter((sale: Sale) => sale.status === "0");
    const successful = allSales.filter((sale: Sale) => sale.status === "1");
    const dailyVolume = getDailyVolume(successful);
    const cardsSold = getCardSold(successful);

    return {
      saleCreated: created,
      saleSuccessful: successful,
      totalSales: created.length,
      dailyVolume: dailyVolume.toString(),
      cardsSold: cardsSold.toString(),
    };
  },
);

export const onGetAssets = createAsyncThunk(
  actionTypes.GET_ASSETS,
  async function prepare(address: string) {
    try {
      const { endersGate, pack } = getAddresses();
      const cardsContract = getContract("EndersGate", endersGate);
      const packsContract = getContract("EndersPack", pack);
      const packsIds = [0, 1, 2, 3];
      const cardsIds = Object.values(cards)
        .reduce((acc: any[], cur) => acc.concat(cur), [])
        .map(
          (card, i) =>
            // card.properties?.id?.value !== undefined
            //   ? card.properties.id.value
            i,
        );
      const balancePacks = await packsContract.methods
        .balanceOfBatch(
          packsIds.map(() => address),
          packsIds,
        )
        .call();
      const balanceCards = await cardsContract.methods
        .balanceOfBatch(
          cardsIds.map(() => address),
          cardsIds,
        )
        .call();

      return {
        balanceCards: cardsIds.map((id, i) => ({
          id,
          balance: balanceCards[i],
        })),
        balancePacks: packsIds.map((id, i) => ({
          id,
          balance: balancePacks[i],
        })),
      };
    } catch (err) {
      console.log({ err });
      throw err;
    }
  },
);

export const onExchangeERC721to1155 = createAsyncThunk(
  actionTypes.EXCHANGE_NFT,
  async function prepare(args: {
    from: string;
    nfts: string[];
    provider: any;
    // user: any;
  }) {
    const {
      from,
      nfts,
      // user,
      provider,
    } = args;

    // const relation = user.relation("events");
    try {
      const { exchange } = getAddresses();

      const marketplaceContract = getContractCustom(
        "ExchangeERC1155",
        exchange,
        provider,
      );

      const { transactionHash } = await marketplaceContract.methods
        .exchangeAllERC1155(nfts)
        .send({ from: from });

      return { from, nfts };
    } catch (err) {
      console.log({ err });
      return { err };
    }
  },
);

export const onApproveERC1155 = createAsyncThunk(
  actionTypes.EXCHANGE_NFT,
  async function prepare(args: {
    from: string;
    pack: string;

    provider: any;
    // user: any;
  }) {
    const {
      from,
      pack,
      // user,
      provider,
    } = args;

    const { exchange } = getAddresses();
    // const relation = user.relation("events");
    try {
      const marketplaceContract = getContractCustom(
        "ERC721Seadrop",
        pack,
        provider,
      );

      const { transactionHash } = await marketplaceContract.methods
        .setApprovalForAll(exchange, true)
        .send({ from: from });

      // const event = createEvent({
      //   type: "sell",
      //   metadata: {
      //     from,
      //     tokenId,
      //     startingPrice,
      //     amount,
      //     duration,
      //     address,
      //     transactionHash,
      //   },
      // });

      // await event.save();
      // relation.add(event);
      // await user.save();

      return { from, exchange, pack };
    } catch (err) {
      return { err };
      console.log({ err });
    }
  },
);

export const onSellERC1155 = createAsyncThunk(
  actionTypes.SELL_NFT,
  async function prepare(args: {
    from: string;
    tokenId: number | string;
    startingPrice: number | string;
    amount: number | string;
    duration: string;
    tokens: string[];
    address: string;
    provider: any;
    // user: any;
  }) {
    const {
      from,
      tokenId,
      startingPrice,
      amount,
      duration,
      address,
      tokens,
      // user,
      provider,
    } = args;

    // const relation = user.relation("events");
    try {
      const { marketplace } = getAddresses();

      const marketplaceContract = getContractCustom(
        "ClockSale",
        marketplace,
        provider,
      );

      const { transactionHash } = await marketplaceContract.methods
        .createSale(address, tokenId, startingPrice, tokens, amount, duration)
        .send({ from: from });

      // const event = createEvent({
      //   type: "sell",
      //   metadata: {
      //     from,
      //     tokenId,
      //     startingPrice,
      //     amount,
      //     duration,
      //     address,
      //     transactionHash,
      //   },
      // });

      // await event.save();
      // relation.add(event);
      // await user.save();

      return { from, tokenId, startingPrice, amount, duration, address };
    } catch (err) {
      console.log({ err });
    }
  },
);

export const onBuyERC1155 = createAsyncThunk(
  actionTypes.BUY_NFT,
  async function prepare(args: {
    seller: string;
    tokenId: number | string;
    token: string;
    bid: string | number;
    amount: string | number;
    nftContract: string;
    provider: any;
    user: any;
  }) {
    const { seller, tokenId, token, amount, bid, provider, user } = args;
    // const user = Moralis.User.current();
    // const relation = user.relation("events");
    try {
      const { marketplace } = getAddresses();
      const marketplaceContract = getContractCustom(
        "ClockSale",
        marketplace,
        provider,
      );
      const ERC20 = getContractCustom("ERC20", token, provider);
      const addresses = getTokensAllowed();
      if (
        token == addresses.filter((item) => item.name == "MATIC")[0].address
      ) {
        await marketplaceContract.methods
          .buy(tokenId, amount, token)
          .send({ from: user, value: bid });
      } else {
        const allowance = await ERC20.methods
          .allowance(user, marketplace)
          .call();
        const price = await marketplaceContract.methods
          .getPrice(tokenId, token, amount)
          .call();
        if (allowance < price) {
          await ERC20.methods
            .increaseAllowance(
              marketplace,
              "1000000000000000000000000000000000000000000000000",
            )
            .send({
              from: user,
            });
        }
        await marketplaceContract.methods
          .buy(tokenId, amount, token)
          .send({ from: user });
      }
      // await event.save();
      // relation.add(event);
      // await user.save
    } catch (err) {
      console.log({ err });
    }
    return { seller, tokenId, amount, bid, provider };
  },
);

export const onCancelSale = createAsyncThunk(
  actionTypes.CANCEL_NFT,
  async function prepare(args: {
    tokenId: number | string;
    nftContract: string;
    provider: any;
    user: any;
  }) {
    const { tokenId, provider, user } = args;
    // const relation = user.relation("events");

    const { marketplace } = getAddresses();
    const marketplaceContract = getContractCustom(
      "ClockSale",
      marketplace,
      provider,
    );
    const { transactionHash } = await marketplaceContract.methods
      .cancelSale(tokenId)
      .send({ from: user });

    const event = createEvent({
      type: "cancel",
      metadata: { tokenId, from: user, transactionHash },
    });

    // await event.save();
    // relation.add(event);
    await user.save();

    return { tokenId, provider };
  },
);
