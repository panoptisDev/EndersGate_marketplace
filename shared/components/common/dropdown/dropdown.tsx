import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { DotsHorizontalIcon } from "@heroicons/react/solid";
import clsx from "clsx";
import { Typography } from "../typography";
import { Icons } from "@shared/const/Icons";
import { CaretDownOutlined, CaretUpOutlined } from "@ant-design/icons";

export const Dropdown: React.FC<any> = ({ classTitle, title, children }) => {
  return (
    <div>
      <Menu as="div" className="relative inline-block text-left">
        {({ open }) => {
          console.log("open", open);
          return (
            <>
              <div>
                <Menu.Button className="inline-flex justify-center w-full font-medium bg-transparent focus:outline-none">
                  <div
                    className={clsx(
                      "flex justify-center items-center cursor-pointer rounded-md",
                      classTitle,
                    )}
                  >
                    <Typography
                      type="subTitle"
                      className="mr-1 whitespace-nowrap"
                    >
                      {title}
                    </Typography>
                    {open ? <CaretUpOutlined /> : <CaretDownOutlined />}
                  </div>
                </Menu.Button>
              </div>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute top-0 right-3 z-20 md:mt-7 origin-top-right bg-overlay divide-y shadow-lg rounded-[6px] focus:outline-none">
                  <div>{children}</div>
                </Menu.Items>
              </Transition>
            </>
          );
        }}
      </Menu>
    </div>
  );
};
