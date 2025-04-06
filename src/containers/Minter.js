import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { InboxOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { publicKey } from "@metaplex-foundation/umi";
import { useForm } from "antd/lib/form/Form";
import { useState } from "react";
import axios from "axios";
import BN from "bn.js";
import {
    Button,
    Card,
    Form,
    Input,
    Upload,
    Row,
    Col,
    notification,
    Alert,
    InputNumber,
    Tabs,
} from "antd";
import {
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    getAssociatedTokenAddress,
    createInitializeMintInstruction,
    MINT_SIZE,
} from "@solana/spl-token";
import {
	findMasterEditionPda,
	findMetadataPda,
	mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import MintNFT from "../idl/share_nft.json";

const TOKEN_METADATA_PROGRAM_ID = new anchor.web3.PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

const SHAREIO_NFT_PROGRAM_ID = new anchor.web3.PublicKey(
    "EYMs5Mm5vTuUjxR9R5AvAZCBDK5SJc9tDXVa164ZxSbc"
);

const PINATA_JWT = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiIyOWE2OWE2ZC0wOGJkLTQxYmUtYTdkNC00YzgxYWMyNTNjN2EiLCJlbWFpbCI6Im1hcmtAMWtpbi5pbyIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImlkIjoiRlJBMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfSx7ImlkIjoiTllDMSIsImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxfV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI0MzMwYWUxOWMyN2M2N2Q2YTQ5OCIsInNjb3BlZEtleVNlY3JldCI6IjljMzZlZGFiNDJkY2Q2NThiOGQ5NGU4M2M0NzIzMjRhNzg1OGRiZWI1ZGIzNjkwYmJmOGZlNGJlZDViYTA2NzciLCJpYXQiOjE2NjAxNjA3MTh9.GZ76EVOApIboim8Ad-_tZ-LjTfPd5OQcXWS847AAyhY"

const nftDefaultItems = [
    {
        "name": "AI-NFT#1",
        "symbol": "SHAREIO",
        "imageUrl": "https://1kin.mypinata.cloud/ipfs/QmV9wewDDL5eFrez7KxMxwVwmaNchGg2nJiCaiMX3uVE74",
        "metadataUrl": "https://1kin.mypinata.cloud/ipfs/QmVaSfEqR12z3sSecrbnxBTq9t1fcSUVxdpczXcLPJ8cVq",
        "price": 0.2,
        "seller": 'CPT78cqwTM3VaTkwSTDd9TK4dSfyeqoTDfuPH6tnxmPj'
    },
    {
        "name": "AI-NFT#2",
        "symbol": "SHAREIO",
        "imageUrl": "https://1kin.mypinata.cloud/ipfs/QmabMnupR7zu24DrAXjKfnkvkJFUwNG3ikyCYhXdhReJKU",
        "metadataUrl": "https://1kin.mypinata.cloud/ipfs/QmZF5Mq8XRhuFvBDHiisi8Lbh74xmmUZnhVj9g9TfBT7Mh",
        "price": 0.1,
        "seller": 'CPT78cqwTM3VaTkwSTDd9TK4dSfyeqoTDfuPH6tnxmPj'
    }
]

const Minter = () => {
    let navigate = useNavigate();
    const { connection } = useConnection();
    const wallet = useWallet();

    const [form] = useForm();

    const [imageFile, setImageFile] = useState(null);
    const [imageFileUrl, setImageFileUrl] = useState(null);
    const [saleType, setSaleType] = useState("no_sale");
    const [tab, setTab] = useState('marketplace');

    const [uploading, setUploading] = useState(false);
    const [minting, setMinting] = useState(false);
    const [mintSuccess, setMintSuccess] = useState(false);
    const [nftItems, setNftItems] = useState(nftDefaultItems);

    const onFileSelected = (file) => {
        setImageFile(file)
        setImageFileUrl(URL.createObjectURL(file))
        return false;
    };

    console.log('nftItems', nftItems)

    const onCreate = async (values) => {
        console.log("Connection: ", connection);
        console.log("Wallet: ", wallet);
        console.log("values: ", values);

        let {
            name,
            symbol,
            description,
            trait1,
            trait2,
            trait3,
            price,
            seller,
        } = values;

        let uploadedImageUrl = await uploadImageToIpfs();
        if (uploadImageToIpfs == null) return;
        console.log("Uploaded image url: ", uploadedImageUrl);

        let uploadedMetatdataUrl = await uploadMetadataToIpfs(
            name,
            symbol,
            description,
            uploadedImageUrl,
            trait1,
            trait2,
            trait3
        );
        if (uploadedMetatdataUrl == null) return;
        console.log("Uploaded meta data url: ", uploadedMetatdataUrl);
        nftItems.push({
            name,
            symbol,
            imageUrl: uploadedImageUrl,
            metadataUrl: uploadedMetatdataUrl,
            price,
            seller
        })

        setNftItems([...nftItems])
        notification.open({
            message: 'Generated new NFT meta',
            description:
                'New NFT meta has been created and you can check it in marketplace tab',
        });
    };

  const uploadImageToIpfs = async () => {
        setUploading(true);

        const formData = new FormData();
        formData.append("file", imageFile);

        const pinataMetadata = JSON.stringify({
            name: "NFT Image",
        });
        formData.append("pinataMetadata", pinataMetadata);

        const pinataOptions = JSON.stringify({
            cidVersion: 0,
        });
        formData.append("pinataOptions", pinataOptions);

        const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
                Authorization: PINATA_JWT,
            },
            body: formData,
        });
        const resData = await res.json();
        console.log(resData);

        setUploading(false);

        if (!resData.IpfsHash) {
            notification["error"]({
                message: "Error",
                description: "Something went wrong when updloading the file",
            });
            return null;
        }

        return `https://1kin.mypinata.cloud/ipfs/${resData.IpfsHash}`;
    };

    async function uploadMetadataToIpfs2(metadata){
        var config = {
            method: 'post', 
            url: 'https://api.pinata.cloud/pinning/pinJSONToIPFS',
            headers: { 
                'Content-Type': 'application/json', 
                'Authorization': PINATA_JWT
            },
            data : JSON.stringify(metadata)
        };
        
        const res = await axios(config);
        console.log(res.data);
        
        if (res.data == null) {
            return null;
        } else {
            return res.data;
        }
    };

    const uploadMetadataToIpfs = async (
        name,
        symbol,
        description,
        uploadedImage,
        trait1,
        trait2,
        trait3
    ) => {
        const metadata = {
        name,
        symbol,
        description,
        image: uploadedImage,
        attributes: [
            {
                trait_type: "trait1",
                value: trait1,
            },
            {
                trait_type: "trait2",
                value: trait2,
            },
            {
                trait_type: "trait3",
                value: trait3,
            },
        ],
        };

        setUploading(true);
        const uploadedMetadata = await uploadMetadataToIpfs2(metadata);
        setUploading(false);

        if (uploadedMetadata == null) {
            return null;
        } else {
            return `https://1kin.mypinata.cloud/ipfs/${uploadedMetadata.IpfsHash}`;
        }
    };

    const mint = async (name, symbol, metadataUrl, seller, price) => {
        console.log('[ ] metadataUrl', metadataUrl)

        const provider = new anchor.AnchorProvider(connection, wallet);
        console.log("[ ] provider: ", provider.wallet.publicKey.toString())
        anchor.setProvider(provider);

        const program = new Program(
            MintNFT,
            SHAREIO_NFT_PROGRAM_ID,
            provider
        );

        const umi = createUmi("https://api.devnet.solana.com")
            .use(walletAdapterIdentity(provider.wallet))
            .use(mplTokenMetadata());

        console.log("Program Id: ", program.programId.toBase58());
        console.log("Mint Size: ", MINT_SIZE);
        const lamports = await program.provider.connection.getMinimumBalanceForRentExemption(MINT_SIZE);
        console.log("Mint Account Lamports: ", lamports);

        const getMetadata = async (mint) => {
            return (
                await anchor.web3.PublicKey.findProgramAddress(
                    [
                        Buffer.from("metadata"),
                        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                        mint.toBuffer(),
                    ],
                    TOKEN_METADATA_PROGRAM_ID
                )
            )[0];
        };

        const mintKey = anchor.web3.Keypair.generate();

        const nftTokenAccount = await getAssociatedTokenAddress(
            mintKey.publicKey,
            provider.wallet.publicKey
        );
        console.log("NFT Account: ", nftTokenAccount.toBase58());
        console.log("Mint key: ", mintKey.publicKey.toString());
        console.log("User: ", provider.wallet.publicKey.toString());

        const metadataAddress = await getMetadata(mintKey.publicKey);
        console.log("Metadata address: ", metadataAddress.toBase58());

        // derive the metadata account
        let metadataAccount = findMetadataPda(umi, {
            mint: publicKey(mintKey.publicKey),
        })[0];

        console.log('metadataAccount', metadataAccount)

        //derive the master edition pda
        let masterEditionAccount = findMasterEditionPda(umi, {
            mint: publicKey(mintKey.publicKey),
        })[0];
        console.log('masterEditionAccount', masterEditionAccount)

        /**
         * This is the test part.
         */

        try {
            const tx = await program.methods.mint(
                name,
                symbol,
                metadataUrl,
                new BN(price * 1000000000)
            ).accounts({
                signer: provider.wallet.publicKey,
                seller: new anchor.web3.PublicKey(seller),
                mint: mintKey.publicKey,
                associatedTokenAccount: nftTokenAccount,
                metadataAccount: metadataAddress,
                masterEditionAccount: masterEditionAccount,
                ixSysvar: anchor.web3.SYSVAR_INSTRUCTIONS_PUBKEY,
                tokenProgram: TOKEN_PROGRAM_ID,
                associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
                tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
                systemProgram: anchor.web3.SystemProgram.programId,
                rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            })
            .signers([mintKey]).instruction();
                
            const mint_tx = new anchor.web3.Transaction().add(
                anchor.web3.SystemProgram.createAccount({
                    fromPubkey: provider.wallet.publicKey,
                    newAccountPubkey: mintKey.publicKey,
                    space: MINT_SIZE,
                    programId: TOKEN_PROGRAM_ID,
                    lamports,
                }),
                createInitializeMintInstruction(
                    mintKey.publicKey,
                    0,
                    provider.wallet.publicKey,
                    provider.wallet.publicKey
                ),
                createAssociatedTokenAccountInstruction(
                    provider.wallet.publicKey,
                    nftTokenAccount,
                    provider.wallet.publicKey,
                    mintKey.publicKey
                ),
                tx
            );

            // let blockhashObj = await connection.getLatestBlockhash();
            // console.log("[ ] blockhashObj", blockhashObj);
            // mint_tx.recentBlockhash = blockhashObj.blockhash;

            // const signature2 = await wallet.sendTransaction(mint_tx, connection, {
            //     signers: [
            //         mintKey
            //     ]
            // });
            // console.log("[ ] signature: ", signature2);

            // await connection.confirmTransaction({
            //     signature: signature2,
            //     commitment: 'confirmed'
            // });

            mint_tx.feePayer = provider.wallet.publicKey;
            mint_tx.recentBlockhash = (
                await connection.getLatestBlockhash()
            ).blockhash;
            mint_tx.partialSign(mintKey);

            const signedTransaction = await provider.wallet.signTransaction(mint_tx);
            // signedTransaction.addSignature(mintKey.publicKey, mintKey.secretKey);

            console.log("[ ] signedTransaction: ", signedTransaction);
            const txid =  await connection.sendRawTransaction(signedTransaction.serialize());

            

            console.log("[ ] Mint x!", txid);

            const tokenLink = (
                <a href={`https://solscan.io/token/${mintKey.publicKey}?cluster=devnet`} target='_blank'>
                    See your token in solscan
                </a>
            );
        
            notification.open({
                message: 'Purchased Successfully',
                description: tokenLink,
                duration: 2
            });

            return true;
        } catch(e) {
            console.log('error', e)
            return false;
        }
    };

    const onMintAgain = () => {
        setMintSuccess(false);
        form.resetFields();
    };

    const onChange = (key) => {
        setTab(key)
    };

    const purchase = async (index) => {
        const item = nftItems[index]
        const {name, symbol, metadataUrl, seller, price} = item
        await mint(name, symbol, metadataUrl, seller, price)
    }

    const tabs = [
        {
            key: 'marketplace',
            label: 'Marketplace'
        },
        {
            key: 'add-meta',
            label: 'Create NFT Meta'
        },
    ];

    return (
        <div>
            <Tabs defaultActiveKey={tab} items={tabs} onChange={onChange} style={{margin:'0 24px'}}/>
            {tab === 'marketplace' &&  <Row style={{ margin: 30 }}>
                {minting && (
                    <Col span={16} offset={4}>
                        <Alert message="Minting..." type="info" showIcon />
                    </Col>
                )}
                <div style={{display:'flex'}}>
                    {nftItems.map((item, index)=><Card
                        style={{
                        width: 300,
                        marginRight: 20,
                        marginBottom: 20
                        }}
                        cover={
                        <img
                            alt={item.name}
                            src={item.imageUrl}
                            style={{height: 300, objectFit: 'cover'}}
                        />
                        }
                        actions={[
                        <Button onClick={()=>purchase(index)}>Purchase</Button>,
                        ]}
                        key={index}
                    >
                        <Card.Meta
                        title={item.name}
                        description={item.price + ' SOL'}
                        />
                    </Card>)}
                </div>
            </Row>}
            {tab === 'add-meta' && <Row style={{ margin: 30 }}>
                {uploading && (
                    <Col span={16} offset={4}>
                        <Alert message="Uploading image..." type="info" showIcon />
                    </Col>
                )}
                <Col span={16} offset={4} style={{ marginTop: 10 }}>
                    <Card title="Create NFT Meta">
                        <Form
                            form={form}
                            layout="vertical"
                            labelCol={8}
                            wrapperCol={16}
                            onFinish={onCreate}
                        >
                            <Row gutter={24}>
                                <Col xl={12} span={24}>
                                    <Form.Item
                                        label="Image"
                                        name="image"
                                        rules={[{ required: true, message: "Please select image!" }]}
                                    >
                                        <Upload.Dragger
                                            name="image"
                                            beforeUpload={onFileSelected}
                                            maxCount={1}
                                            height={400}
                                        >
                                            <p className="ant-upload-drag-icon">
                                                <InboxOutlined />
                                            </p>
                                            <p className="ant-upload-text">
                                                Click or drag file to this area to upload
                                            </p>
                                            <p className="ant-upload-hint">
                                                Support for a singe image.
                                            </p>
                                        </Upload.Dragger>
                                    </Form.Item>
                                </Col>
                                <Col xl={12} span={24}>
                                    <Form.Item
                                        label="Name"
                                        name="name"
                                        rules={[{ required: true, message: "Please input name!" }]}
                                    >
                                        <Input placeholder="Input nft name here." />
                                    </Form.Item>

                                    <Form.Item
                                        label="Symbol"
                                        name="symbol"
                                        rules={[{ required: true, message: "Please input symbol!" }]}
                                    >
                                        <Input placeholder="Input nft symbol here." />
                                    </Form.Item>

                                    <Form.Item
                                        label="Description"
                                        name="description"
                                        rules={[{ required: true, message: "Please input description!" },]}
                                    >
                                        <Input.TextArea placeholder="Input nft description here." />
                                    </Form.Item>

                                    <Form.Item label="Traits">
                                        <Input.Group size="large">
                                            <Row gutter={12}>
                                                <Col span={8}>
                                                    <Form.Item
                                                        name="trait1"
                                                        rules={[
                                                        {
                                                            required: true,
                                                            message: "Please input trait1!",
                                                        },
                                                        ]}
                                                    >
                                                        <Input addonBefore="Trait1" placeholder="trait1" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item
                                                        name="trait2"
                                                        rules={[
                                                        {
                                                            required: true,
                                                            message: "Please input trait2!",
                                                        },
                                                        ]}
                                                    >
                                                        <Input addonBefore="Trait2" placeholder="trait2" />
                                                    </Form.Item>
                                                </Col>
                                                <Col span={8}>
                                                    <Form.Item
                                                        name="trait3"
                                                        rules={[
                                                        {
                                                            required: true,
                                                            message: "Please input trait3!",
                                                        },
                                                        ]}
                                                    >
                                                        <Input addonBefore="Trait3" placeholder="trait3" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                        </Input.Group>
                                    </Form.Item>

                                    <Form.Item
                                        name="price"
                                        label="Price"
                                        rules={[{ required: true, message: "Please input price!" }]}
                                    >
                                        <InputNumber
                                            style={{ width: "100%" }}
                                            placeholder="Input your price"
                                            addonAfter="SOL"
                                        />
                                    </Form.Item>

                                    <Form.Item
                                        name="seller"
                                        label="Seller"
                                        rules={[{ required: true, message: "Please input seller address!" }]}
                                    >
                                        <Input
                                            style={{ width: "100%" }}
                                            placeholder="Input seller address"
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item wrapperCol={{ offset: 6, span: 12 }}>
                                <Button type="primary" htmlType="submit" style={{ width: 200 }}>
                                    Create
                                </Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>}
        </div>
    );
};

export default Minter;