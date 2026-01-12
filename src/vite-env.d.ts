/// <reference types="vite/client" />

// Chrome Extension API types
declare namespace chrome {
  export const runtime: {
    id: string;
    sendMessage: (message: any, callback?: (response: any) => void) => void;
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: (response: any) => void) => boolean | void) => void;
    };
    lastError?: { message: string };
    onInstalled: {
      addListener: (callback: () => void) => void;
    };
  };

  export namespace tabs {
    export function query(queryInfo: { active?: boolean; currentWindow?: boolean }): Promise<Tab[]>;
    export function update(tabId: number, updateProperties: { url?: string }): Promise<Tab>;
    export function create(createProperties: { url: string }): Promise<Tab>;
    export interface Tab {
      id?: number;
      url?: string;
      title?: string;
    }
  }

  export const sidePanel: {
    open: (options: { tabId: number }) => Promise<void>;
    setPanelBehavior: (options: { openPanelOnActionClick: boolean }) => Promise<void>;
  };

  export const action: {
    onClicked: {
      addListener: (callback: (tab: Tab) => void) => void;
    };
  };

}
