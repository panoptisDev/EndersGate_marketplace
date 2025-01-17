import React from "react";
import NftMainBanner from "./NftMainBanner";
import Comic from "./Comic";
import NftFooter from "./NftFooter";
import ComicButtons from "./ComicSliders/ComicButtons";
import { Flex } from "@chakra-ui/react";
import { ShopOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";

import {
  editCartComics,
  removeAllComics,
  removeFromCartComics,
} from "@redux/actions";
import Web3 from "web3";
import clsx from "clsx";
import comic from "../../comics.json";

import { XIcon } from "@heroicons/react/solid";
import {
  getAddressesEth,
  getContractCustom,
  getTokensAllowed,
  getTokensAllowedEth,
  switchChain,
} from "@shared/web3";
import { useCartModal } from "../common/cartModal";
import { nFormatter } from "../common/specialFields/SpecialFields";

function Comics() {
  const { Modal, show, isShow, hide } = useCartModal();

  const { ethAddress: account } = useSelector(
    (state: any) => state.layout.user,
  );

  const [priceMatic, setPriceMatic] = React.useState("0");
  const [basePriceMATIC, setBasePriceMatic] = React.useState("0");
  const [priceUSD, setPriceUSD] = React.useState("0");
  const [tokenSelected, setTokenSelected] = React.useState("");
  const [messageBuy, setMessageBuy] = React.useState("");
  const [balance, setComicsOwned] = React.useState([]);

  const tokensAllowed = getTokensAllowedEth();

  const { networkEth, providerEth, provider, cartComics } = useSelector(
    (state: any) => state.layout,
  );

  const { comics: comicsAddress, MATICUSD } = getAddressesEth();

  const dispatch = useDispatch();

  const getComicsNFTs = async () => {
    const comics = getContractCustom("Comics", comicsAddress, providerEth);
    const nftsId = await comics.methods.comicIdCounter().call();
    const balances = await comics.methods
      .balanceOfBatch(
        new Array(parseInt(nftsId)).fill(account),
        new Array(parseInt(nftsId)).fill(1).map((i, id) => id + 1),
      )
      .call();

    setComicsOwned(
      balances.map((i, id) => {
        return { id: id + 1, balance: parseInt(i) };
      }),
    );
  };

  const getPriceUSD = async () => {
    const comics = getContractCustom("Comics", comicsAddress, providerEth);
    const priceUSD = await comics.methods
      .comics(await comics.methods.comicIdCounter().call())
      .call();
    const Aggregator = getContractCustom("Aggregator", MATICUSD, providerEth);
    const priceMATIC = await Aggregator.methods.latestAnswer().call();
    setBasePriceMatic(priceMATIC);
    setPriceUSD(priceUSD.priceUSD);
    console.log(priceMATIC, priceUSD.priceUSD);
  };

  const getPriceMatic = async () => {
    try {
      const price =
        (parseFloat(
          cartComics
            ?.map((item, i) => {
              return (parseInt(priceUSD) / 10 ** 6) * item.quantity;
            })
            ?.reduce((item, acc) => {
              return item + acc;
            }),
        ) *
          10 ** 8) /
        parseInt(basePriceMATIC);
      setPriceMatic((price + price * 0.000005).toFixed(8).toString());
    } catch (e) {}
  };

  React.useEffect(() => {
    getPriceUSD();
  }, [comicsAddress, providerEth]);

  React.useEffect(() => {
    console.log(basePriceMATIC, "price ETH");
  }, [priceMatic]);

  React.useEffect(() => {
    if (account) {
      getComicsNFTs();
    }
  }, [account]);

  React.useEffect(() => {
    if (cartComics.length > 0) {
      if (basePriceMATIC && priceUSD) {
        getPriceMatic();
      }
    } else {
      setPriceMatic("0");
    }
  }, [cartComics, priceUSD]);

  React.useEffect(() => {
    setTokenSelected(tokensAllowed[0].address);
  }, [tokensAllowed]);

  const buyComics = async () => {
    await switchChain(networkEth);
    const comics = getContractCustom("Comics", comicsAddress, provider);
    if (tokenSelected == "") {
      return;
    }
    try {
      setMessageBuy(`Processing your purchase...`);

      const { ids, amounts, token } = {
        ids: cartComics.map((item) => item.id),
        amounts: cartComics.map((item) => item.quantity.toString()),
        token: tokenSelected,
      };

      let price = "0";
      const ERC20 = getContractCustom("ERC20", token, providerEth);
      const addressesAllowed = getTokensAllowed();
      if (
        tokenSelected ==
        addressesAllowed.filter((item) => item.name == "MATIC")[0].address
      ) {
        const Aggregator = getContractCustom(
          "Aggregator",
          MATICUSD,
          providerEth,
        );
        console.log("MATIC1");

        const priceMATIC = await Aggregator.methods.latestAnswer().call();
        const preprice =
          (parseFloat(
            cartComics
              ?.map((item, i) => {
                console.log(item.priceUSD, item.quantity, "precio");
                return (parseInt(item.priceUSD) / 10 ** 6) * item.quantity;
              })
              .reduce((item, acc) => {
                console.log(item, acc, "reducer");
                return item + acc;
              }),
          ) *
            10 ** 8) /
          priceMATIC;

        console.log(
          preprice,
          parseFloat(
            cartComics
              ?.map((item, i) => {
                console.log(item.priceUSD, item.quantity, "precio");
                return (parseInt(item.priceUSD) / 10 ** 6) * item.quantity;
              })
              .reduce((item, acc) => {
                return item + acc;
              }),
          ) *
            10 ** 8,
          priceMATIC,
          "XD",
        );

        price = Web3.utils.toWei(
          (preprice + preprice * 0.000005).toFixed(10).toString(),
          "ether",
        );
        console.log("MATIC 2", ids, amounts, token, account);

        await comics.methods
          .buyBatch(account, ids, amounts, token)
          .send({ from: account, value: price });

        console.log("MATIC 3");
      } else {
        console.log("in token", account, comicsAddress, ERC20);

        const allowance = await ERC20.methods
          .allowance(account, comicsAddress)
          .call();
        console.log("in", allowance);

        if (allowance < 1000000000000) {
          setMessageBuy(
            `Increasing the allowance of ${
              tokensAllowed.filter((item) => item.address == tokenSelected)[0]
                .name
            } 1/2`,
          );
          console.log("increasing");
          await ERC20.methods
            .increaseAllowance(
              comicsAddress,
              "1000000000000000000000000000000000000000000000000",
            )
            .send({
              from: account,
            });
          setMessageBuy("Buying your NFT(s) 2/2");
          await comics.methods
            .buyBatch(account, ids, amounts, token)

            .send({ from: account });
        } else {
          setMessageBuy("Buying your NFT(s)");
          await comics.methods
            .buyBatch(account, ids, amounts, token)

            .send({ from: account });
        }

        // }
      }
    } catch (error) {
      console.log(error);
    }
    setMessageBuy(``);
    await getComicsNFTs();
    hide();
    dispatch(removeAllComics());
  };

  return (
    <Flex
      transition=".5s all ease"
      zIndex={10}
      overflowX="hidden"
      top={20}
      pt={54}
      bg="#000000"
      minHeight="100vh"
      flexDir="column"
      className="body-bg-color nft-main-container"
    >
      <Modal
        isShow={isShow}
        cart={cartComics}
        removeAll={removeAllComics}
        messageBuy={messageBuy}
        tokensAllowed={tokensAllowed}
        withoutX
        tokenSelected={tokenSelected}
        setTokenSelected={setTokenSelected}
        buy={buyComics}
        priceMatic={priceMatic}
        isMatic={false}
        itemsCart={cartComics.map((item, index) => {
          console.log(item.priceUSD, comic);
          return (
            <div
              className={
                "gap-2 py-2 flex items-center justify-between gap-8 text-white cursor-pointer w-full px-2 border border-transparent-color-gray-200 rounded-xl"
              }
              onClick={item.onClick}
            >
              <div className="flex items-center justify-start gap-2 w-full">
                <div className="rounded-xl flex flex-col text-gray-100 relative overflow-hidden border border-gray-500 h-20 w-20">
                  <img
                    src={comic[item.id - 1]?.comic_banner}
                    className={`absolute bottom-0 top-0 left-[-40%] right-0 m-auto min-w-[175%]`}
                    alt=""
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <h3 className={"text-md font-[700] uppercase"}>
                    {comic[item.id - 1]?.name}
                  </h3>

                  <div className="flex gap-2 items-end">
                    <img src={"icons/logo.png"} className="w-8 h-8" alt="" />
                    <img src="icons/POLYGON.svg" className="w-6 h-6" alt="" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <div className="flex flex-col !shrink-0">
                  <h3 className={"text-sm font-[700] whitespace-nowrap w-24"}>
                    Price:
                  </h3>
                  <h3
                    className={clsx(
                      "text-sm font-[700] uppercase whitespace-nowrap w-24",
                    )}
                  >
                    {nFormatter(parseInt(item.priceUSD) / 10 ** 6)} USD{" "}
                  </h3>
                </div>
                <input
                  defaultValue={item.quantity}
                  type="number"
                  min={1}
                  className="text-lg px-2 text-white w-12 bg-transparent rounded-xl border border-overlay-overlay"
                  onChange={(e) => {
                    console.log(e.target.value);
                    dispatch(
                      editCartComics({
                        id: index,
                        item: {
                          ...item,
                          quantity: e.target.value,
                          priceUSD: priceUSD,
                        },
                      }),
                    );
                    getPriceMatic();
                  }}
                ></input>
                <div
                  className="rounded-full p-1 w-8 h-8 border border-transparent-color-gray-200 hover:bg-red-primary text-white shrink-0 cursor-pointer"
                  onClick={() => {
                    dispatch(removeFromCartComics({ id: item.id }));
                  }}
                >
                  <XIcon></XIcon>
                </div>
              </div>
            </div>
          );
        })}
      />
      <NftMainBanner />
      <ComicButtons
        getPriceMatic={getPriceMatic}
        showCart={show}
        priceUSD={priceUSD}
        balance={balance}
      />
      {/* <Comic /> */}
      <NftFooter />
      <Flex
        transition=".5s all ease"
        zIndex={124}
        bottom={6}
        right={9}
        flexDir="column"
        className="fixed rounded-xl border border-overlay-border bg-overlay p-4 items-center justify-center cursor-pointer"
        onClick={() => show()}
      >
        <ShopOutlined className="text-2xl flex items-center text-white justify-center relative" />
      </Flex>
    </Flex>
  );
}

export default Comics;
