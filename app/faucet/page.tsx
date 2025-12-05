"use client";
import Link from "next/link";
import Image from "next/image";
import Footer from "@/components/Footer";
import { WalletConnect } from "@/components/walletConnect";
import { useAccount, useSwitchChain, useChainId } from "wagmi";
import { base, baseSepolia, avalanche, avalancheFuji } from "wagmi/chains";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI, CONTRACT_ADDRESSES } from "@/lib/contract";
import { useEthersProvider, useEthersSigner } from "@/hooks/useEthers";

type FaucetChain = typeof base | typeof baseSepolia | typeof avalanche | typeof avalancheFuji;

const SUPPORTED_CHAINS: FaucetChain[] = [base, baseSepolia, avalanche, avalancheFuji];

export default function Faucet() {
    const { isConnected } = useAccount();
    const connectedChainId = useChainId();
    const { switchChain, isPending: isSwitching } = useSwitchChain();
    const [selectedId, setSelectedId] = useState<number>(baseSepolia.id);
    const [isMinting, setIsMinting] = useState(false);
  const [mintError, setMintError] = useState<string | null>(null);
    const selectedChain = useMemo(() => SUPPORTED_CHAINS.find((c) => c.id === selectedId)!, [selectedId]);
    const isMatching = connectedChainId === selectedId;

  const signer = useEthersSigner();
  const provider = useEthersProvider();

    const handleMint = useCallback(async () => {
        if (!isConnected || !isMatching) return;
        const faucetAddress = CONTRACT_ADDRESSES[selectedId]!;
        try {
            setIsMinting(true);
            setMintError(null);
            
            if (!provider || !signer) {
                throw new Error("Please connect your wallet");
            }

            const contract = new ethers.Contract(
                faucetAddress,
                CONTRACT_ABI as ethers.InterfaceAbi,
                signer
            );
            const tx = await contract.mint();
            await tx.wait();
    } catch (e) {
      const err = e as unknown as { reason?: string; shortMessage?: string; message?: string };
      const reason = err?.reason || err?.shortMessage || err?.message || "Transaction failed";
      setMintError(reason);
    } finally {
            setIsMinting(false);
        }
  }, [isConnected, isMatching, provider, signer, selectedId]);

    return (
        <div className="min-h-screen bg-white-pattern">
            {/* Hero/Header */}
            <section className="min-h-screen flex flex-col justify-between pb-10 md:pb-20">
                <div className="flex justify-between items-center pt-20 md:pt-32 container mx-auto px-4 md:px-16 ">
                    <Link href="/">
                        <Image
                            className="cursor-pointer"
                            src="/assets/logos/logo.svg"
                            width={150}
                            height={150}
                            alt="Randamu Logo"
                        />
                    </Link>
                </div>

                {/* Main Content */}
                <div className="container mx-auto px-4 md:px-16">
                    <div className="pt-10 md:pt-20">
                        <div className="space-y-4 md:space-y-6 mb-10 md:mb-16">
                            <h1 className="font-funnel-display text-3xl md:text-5xl lg:text-7xl font-bold text-black max-w-4xl">
                                RUSD Faucet
                            </h1>
                            <p className="font-funnel-display text-lg md:text-xl text-gray-500">
                                Connect your wallet, select a network, and mint RUSD tokens
                            </p>
                        </div>

                        {/* Connect Wallet */}
                        <div className="mb-6">
                            <WalletConnect />
                        </div>

                        <div className="container mx-auto ">
                            <div className="flex flex-row items-center  justify-end border-t border-gray-200 pt-6 md:pt-8 gap-4">
                                {/* Network Selector (Custom) */}
                                <label className="font-funnel-display text-gray-900">Network</label>
                                <CustomDropdown
                                    options={SUPPORTED_CHAINS.map((c) => ({ id: c.id, label: c.name }))}
                                    value={selectedId}
                                    onChange={setSelectedId}
                                />
                                {!isMatching && isConnected && (
                                    <button
                                        onClick={() => switchChain({ chainId: selectedId })}
                                        disabled={isSwitching}
                                        className="h-12 font-funnel-display text-gray-900 items-center inline-flex bg-white border border-gray-200 hover:border-gray-400 transition-colors justify-center text-center px-4"
                                    >
                                        {isSwitching ? "Switching..." : `Switch to ${selectedChain.name}`}
                                    </button>
                                )}
                                {/* Mint Button */
                                }
                                <button
                                    disabled={!isConnected || !isMatching}
                                    className="h-12 font-funnel-display text-gray-900 items-center inline-flex bg-white border border-gray-200 hover:border-gray-400 transition-colors justify-center text-center px-8 disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={handleMint}
                                >
                                    {isConnected ? (isMatching ? (isMinting ? "Minting..." : "Mint Faucet") : "Connect to selected network") : "Connect Wallet First"}
                                </button>
                                {mintError && (
                                  <p className="font-funnel-display text-sm text-red-600">
                                    {mintError}
                                  </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    );
}

function CustomDropdown({
    options,
    value,
    onChange,
}: {
    options: { id: number; label: string }[];
    value: number;
    onChange: (v: number) => void;
}) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const selected = options.find((o) => o.id === value);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative w-full md:w-[320px]">
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="h-12 w-full text-left font-funnel-display text-gray-900 bg-white border border-gray-200 hover:border-gray-400 transition-colors px-3 focus:outline-none"
            >
                {selected?.label ?? "Select network"}
            </button>
            {open && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200">
                    {options.map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                                onChange(opt.id);
                                setOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 font-funnel-display transition-colors ${opt.id === value ? "bg-gray-50" : "hover:bg-gray-50"
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
