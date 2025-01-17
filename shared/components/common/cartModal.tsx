import { XIcon } from "@heroicons/react/solid";
import clsx from "clsx";
import { useDispatch, useSelector } from "react-redux";
import useMagicLink from "@shared/hooks/useMagicLink";
import { findSum } from "./specialFields/SpecialFields";

import React, { useCallback, useState, Fragment, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";

export const useCartModal = () => {
  const { providerName } = useSelector((state: any) => state.layout.user);

  const { showWallet } = useMagicLink();

  const dispatch = useDispatch();

  const [isShow, setIsShow] = useState(false);
  const cancelButtonRef = useRef<HTMLDivElement>(null);

  const hide = () => {
    setIsShow(false);
  };

  const show = () => {
    setIsShow(true);
  };

  const Modal = useCallback(
    ({
      cart,
      removeAll,
      messageBuy,
      itemsCart,
      priceMatic,
      isMatic,
      tokensAllowed,
      tokenSelected,
      setTokenSelected,
      buy,
      isShow,
    }) => {
      return (
        <Transition.Root show={isShow} as={Fragment}>
          <Dialog
            as="div"
            static
            className="fixed inset-0 overflow-y-auto"
            style={{
              zIndex: 15000,
            }}
            initialFocus={cancelButtonRef}
            open={isShow}
            onClose={hide}
          >
            <div className="flex items-center justify-center pb-20 pt-4 min-h-screen text-center sm:block sm:p-0 bg-overlay-2">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0"
                enterTo="opacity-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Dialog.Overlay className="fixed inset-0 bg-transparent-45 transition-opacity" />
              </Transition.Child>

              {/* This element is to trick the browser into centering the modal contents. */}
              <span
                className="hidden sm:inline-block sm:align-middle sm:h-screen"
                aria-hidden="true"
              >
                &#8203;
              </span>
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <div className="inline-block align-bottom text-left rounded-20 shadow-md transform transition-all sm:align-middle w-max sm:max-w-6xl">
                  <div className="flex flex-col gap-4  bg-overlay p-4 rounded-xl border border-transparent-color-gray-200 relative shadow-inner mt-24">
                    <div className="text-white absolute top-2 right-2">
                      <XIcon
                        onClick={hide}
                        className="w-6 h-6 cursor-pointer"
                      ></XIcon>
                    </div>
                    <div className="text-center text-xl font-bold text-white">
                      Complete checkout
                    </div>
                    {cart.length ? (
                      <div className="flex flex-col items-center border border-transparent-color-gray-200 rounded-xl md:min-w-[500px] md:w-max py-2">
                        <div className="flex justify-between gap-4 w-full">
                          <h2 className="text-lg font-bold text-white opacity-[0.5] py-4 px-4">
                            {cart
                              .map((item: any) => item.quantity)
                              .reduce((acc: any, red: any) => acc + red)}{" "}
                            Item
                            {cart
                              .map((item: any) => item.quantity)
                              .reduce((acc: any, red: any) => acc + red) > 1
                              ? "s"
                              : ""}
                          </h2>{" "}
                          <h2
                            className="text-sm font-bold text-white py-4 px-4 cursor-pointer"
                            onClick={() => {
                              dispatch(removeAll());
                            }}
                          >
                            Clear all
                          </h2>
                        </div>
                        <div className="px-4 py-2 pb-4 gap-2 flex flex-col items-center w-full">
                          {itemsCart.map((item: any, index: any) => {
                            return item;
                          })}
                        </div>
                        <div className="text-md text-white font-bold w-full text-center">
                          Chose currency
                        </div>
                        <div className="flex  gap-4 pb-4 w-full flex-wrap items-center justify-center shadow-inner">
                          {tokensAllowed.map((item: any, index: any) => {
                            return (
                              <div
                                className={clsx(
                                  "w-24 flex items-center justify-center gap-1 rounded-xl cursor-pointer py-1 border border-white",

                                  {
                                    "bg-transparent-color-gray-200 border-none":
                                      tokenSelected !== item.address,
                                  },
                                  {
                                    "bg-overlay border-green-button shadow-[0_0px_10px] shadow-green-button":
                                      tokenSelected === item.address,
                                  },
                                )}
                                onClick={() => {
                                  setTokenSelected(item.address);
                                }}
                              >
                                <img
                                  src={item.logo}
                                  className="w-6 h-6"
                                  alt=""
                                />
                                <h2 className="text-white text-sm font-bold">
                                  {item.name}
                                </h2>
                              </div>
                            );
                          })}
                        </div>
                        <div className="flex gap-6 justify-between w-full text-md text-xl py-2 px-8 border-y border-transparent-color-gray-200 bg-transparent w-full">
                          <div className="flex gap-1 items-center">
                            <h3 className="text-sm  text-white font-[700]">
                              Total price:
                            </h3>
                          </div>
                          <div className="flex flex-col gap items-end">
                            {tokensAllowed.filter(
                              (item: any) =>
                                item.name == "MATIC" || item.name == "ETH",
                            ).length > 0 && (
                              <h3
                                className="text-sm font-[700] text-white flex gap-1 items-center justify-center"
                                style={{ fontSize: "14px" }}
                              >
                                {priceMatic} {isMatic ? "MATIC" : "ETH"}{" "}
                                <img
                                  src={
                                    isMatic
                                      ? "icons/polygon-matic-logo.png"
                                      : "icons/eth.png"
                                  }
                                  className="w-3 h-3"
                                  alt=""
                                />
                              </h3>
                            )}
                            <h3
                              className="text-sm font-[700] text-white opacity-50"
                              style={{ fontSize: "14px" }}
                            >
                              ($
                              {parseInt(
                                cart
                                  ?.map((item: any, i: any) =>
                                    (
                                      parseInt(item.priceUSD) * item.quantity
                                    ).toString(),
                                  )
                                  .reduce((item: any, acc: any) => {
                                    return findSum(item, acc);
                                  }),
                              ) /
                                10 ** 6}
                              )
                            </h3>
                          </div>
                        </div>

                        {messageBuy !== "" ? (
                          <div className="py-2 text-lg text-white font-bold text-center w-full">
                            {messageBuy}
                          </div>
                        ) : (
                          ""
                        )}
                        <div className="w-full flex items-center justify-center py-2">
                          <div
                            onClick={() => {
                              buy();
                            }}
                            className="w-auto px-6 py-2 flex justify-center items-center rounded-xl hover:border-green-button hover:bg-overlay hover:text-green-button border border-transparent-color-gray-200 cursor-pointer bg-green-button font-bold text-overlay transition-all duration-500"
                          >
                            Checkout
                          </div>
                        </div>
                        {providerName == "magic" && (
                          <div
                            className="text-[12px] text-green-button pt-4 font-bold flex items-center justify-center gap-2 cursor-pointer"
                            onClick={() => {
                              showWallet();
                            }}
                          >
                            <img
                              src="icons/wallet.png"
                              className="w-8 pb-2"
                              alt=""
                            />{" "}
                            Add funds to your wallet
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-white font-bold gap-4 text-md text-center w-64 p-4 border border-transparent-color-gray-200 rounded-xl">
                        <img
                          src={"icons/logo.png"}
                          className="w-20 h-20"
                          alt=""
                        />
                        There aren't items in your cart.
                      </div>
                    )}
                  </div>
                </div>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>
      );
    },
    [],
  );

  return { Modal, hide, isShow, show };
};
