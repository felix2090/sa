import { ethers } from "ethers";
import { Web3Provider } from "@ethersproject/providers";
import { ErrorHandler } from "../Error/ErrorHandler";

export default class Metamask {
  _provider: Web3Provider | null;
  constructor() {
    this._provider = null;
    this._initMM();
  }

  private _initMM() {
    const { ethereum, web3 } = window as any;
    if (ethereum != undefined) {
      this._provider = new ethers.providers.Web3Provider(ethereum);
    } else if (web3 != undefined) {
      this._provider = new ethers.providers.Web3Provider(web3.currentProvider);
    } else {
      console.log("Metamask install karle BSDK");
      this._provider = null;
    }
  }

  async _connectMM() {
    try {
      if (this._provider === null) {
        const { ethereum } = window as any;
        if (!ethereum) {
          return {
            success: false,
            message: "Please install metamask",
            address: null,
            chainId: null,
          };
        }
        this._initMM();
      }
      const accounts = await this._provider?.send("eth_requestAccounts", []);
      const network = await this._provider?.getNetwork();
      return {
        message: "Wallet connected",
        success: true,
        address: accounts[0],
        chainId: network?.chainId,
      };
    } catch (err) {
      return {
        message: ErrorHandler(err),
        success: false,
        address: null,
        chainId: null,
      };
    }
  }

  onNetworkChange(callback: (chainId: string) => any) {
    const { ethereum } = window as any;
    if (!ethereum) return;
    ethereum.on("chainChanged", (chainId: string) => {
      callback(chainId);
    });
  }

  onAccountChange(callback: (accounts: string[]) => any) {
    const { ethereum } = window as any;
    if (!ethereum) return;
    ethereum.on("accountsChanged", (accounts: string[]) => {
      callback(accounts);
    });
  }

  async _signMessage(message: string) {
    try {
      const signer = this._provider?.getSigner();
      const signature = await signer?.signMessage(message);
      return {
        message: "Message signed",
        success: true,
        signature: signature,
      };
    } catch (err) {
      return {
        message: ErrorHandler(err),
        success: false,
        signature: null,
      };
    }
  }

  removeListeners() {
    const { ethereum } = window as any;
    if (ethereum && "removeAllListeners" in ethereum) {
      ethereum.removeAllListeners();
    }
  }

  getProviderMM() {
    return this._provider;
  }

  async _switchNetwork(chainId: number) {
    if (isNaN(chainId)) return { success: false, message: "Invalid chainId" };
    if (this._provider === null)
      return { success: false, message: "wallet not connected" };
    try {
      await this._provider?.send("wallet_switchEthereumChain", [
        {
          chainId: `0x${chainId.toString(16)}`,
        },
      ]);
      return {
        message: "Network switched",
        success: true,
      };
    } catch (error: any) {
      if (error.code === 4902) {
        return {
          message: ErrorHandler(error),
          success: false,
        };
      } else if (error.code === -32002) {
        return {
          success: false,
          message: ErrorHandler(error),
        };
      } else if (error.code === "SERVER_ERROR") {
        return {
          success: false,
          message: ErrorHandler(error),
        };
      } else {
        return {
          success: false,
          message: ErrorHandler(error),
        };
      }
    }
  }
}
