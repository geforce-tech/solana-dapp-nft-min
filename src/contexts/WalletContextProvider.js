import { WalletModalProvider as ReactUIWalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useCallback, useMemo } from "react";
import { notification } from "antd";
import {
    ConnectionProvider,
    WalletProvider,
} from "@solana/wallet-adapter-react";
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    SolletExtensionWalletAdapter,
    SolletWalletAdapter,
    TorusWalletAdapter,
} from "@solana/wallet-adapter-wallets";

const WalletContextProvider = (props) => {
    const network = WalletAdapterNetwork.Devnet;
    const endpoint = 'https://solana-devnet.g.alchemy.com/v2/_Ov3AYQKfyHT0tKcFRUzTCr1dv_Ym4Mz'

    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new SolletWalletAdapter({ network }),
            new SolletExtensionWalletAdapter({ network }),
            new TorusWalletAdapter(),
        ],
        [network]
    );

    const onError = useCallback((error) => {
        notification["error"]({
        message: "Error",
        description: error.message
            ? `${error.name}: ${error.message}`
            : error.name,
        });
        console.error(error);
    }, []);

    return (
        <ConnectionProvider endpoint={endpoint}>
            <WalletProvider wallets={wallets} onError={onError} autoConnect={true}>
                <ReactUIWalletModalProvider>
                    {props.children}
                </ReactUIWalletModalProvider>
            </WalletProvider>
        </ConnectionProvider>
    );
};

export default WalletContextProvider;