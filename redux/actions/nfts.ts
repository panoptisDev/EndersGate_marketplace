import {createAction, createAsyncThunk} from "@reduxjs/toolkit";
import {Contract, EventData} from "web3-eth-contract";

import * as actionTypes from "../constants";
import {getAddresses, getContract, getWeb3} from "@shared/web3";
import cards from "../../cards.json";

const getEventsWithTimestamp = async (events: EventData[]) => {
  const web3 = getWeb3();
  return await Promise.all(
    events.map(async (ev) => ({
      ...ev,
      timestamp: (await web3.eth.getBlock(ev.blockNumber)).timestamp,
    }))
  );
};

const loadSaleCreated = async (marketplace: Contract, fromBlock: string) => {
  return (
    await getEventsWithTimestamp(
      await marketplace.getPastEvents("SaleCreated", {
        fromBlock,
        toBlock: "latest",
      })
    )
  ).reduce(
    (acc, event) => ({
      ...acc,
      [event.returnValues._auctionId]: {
        auctionId: event.returnValues._auctionId,
        amount: event.returnValues._amount,
        price: event.returnValues._price,
        duration: event.returnValues._duration,
        seller: event.returnValues._seller,
        timestamp: event.timestamp,
      },
    }),
    {}
  );
};

const loadSaleSuccessfull = async (marketplace: Contract, fromBlock: string) => {
  return (
    await getEventsWithTimestamp(
      await marketplace.getPastEvents("SaleSuccessful", {
        fromBlock,
        toBlock: "latest",
      })
    )
  ).map((event) => ({
    saleId: event.returnValues._aucitonId,
    timestamp: event.timestamp,
  }));
};

const loadSales = async (events: {timestamp: number | string; totalPrice: any}[]) => {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setUTCHours(23, 59, 59, 999);
  return {
    totalSales: events.reduce((acc, cur) => acc + Number(cur.totalPrice), 0),
    dailyVolume: events.reduce(
      (acc, cur) =>
        acc +
        (cur.timestamp > startOfDay.getTime() / 1000 && cur.timestamp < endOfDay.getTime() / 1000
          ? cur.totalPrice
          : 0),
      0
    ),
    cardsSold: events.length,
  };
};

export const onLoadSales = createAsyncThunk(actionTypes.GET_LISTED_NFTS, async function prepare() {
  const addresses = getAddresses();
  const marketplace = getContract("ClockSale", addresses.marketplace);
  const lastSale = Number(await marketplace.methods.tokenIdTracker().call());

  const allSales = await marketplace.methods
    .getSales(new Array(lastSale).fill(0).map((a, i) => i))
    .call();
  //TODO:load rest of data

  return {
    saleCreated: allSales,
    saleSuccessful: allSales,
    totalSales: 0,
    dailyVolume: 0,
    cardsSold: 0,
  };
});

export const onLoadSale = createAsyncThunk(
  actionTypes.GET_LISTED_NFT,
  async function prepare(tokenId: any) {
    const addresses = getAddresses();
    const marketplace = getContract("ClockSale", addresses.marketplace);
    const saleCreated = await marketplace.methods.sales(tokenId).call();
    return saleCreated;
  }
);

export const onGetAssets = createAsyncThunk(
  actionTypes.GET_ASSETS,
  async function prepare(address: string) {
    const {endersGate, pack} = getAddresses();
    const cardsContract = getContract("ERC1155", endersGate);
    const packsContract = getContract("ERC1155", pack);
    const packsIds = [0, 1, 2, 3];
    const cardsIds = Object.values(cards)
      .reduce((acc: any[], cur) => acc.concat(cur), [])
      .map((card) => card.properties.id.value);

    const balancePacks = await packsContract.methods
      .balanceOfBatch(
        packsIds.map(() => address),
        packsIds
      )
      .call();
    const balanceCards = await cardsContract.methods
      .balanceOfBatch(
        cardsIds.map(() => address),
        cardsIds
      )
      .call();

    return {
      balanceCards: cardsIds.map((id, i) => ({id, balance: balanceCards[i]})),
      balancePacks: packsIds.map((id, i) => ({id, balance: balancePacks[i]})),
    };
  }
);
