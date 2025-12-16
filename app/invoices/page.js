'use client';

import { useState, useEffect } from 'react';
import { App, Card, Row, Col, Button, Tag, Modal, Spin, Empty, Typography, Slider, InputNumber, Tabs, Alert, Divider } from 'antd';
import {
  DollarOutlined,
  ClockCircleOutlined,
  ShopOutlined,
  StopOutlined,
  EditOutlined,
  TagOutlined,
  WalletOutlined,
  InfoCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  FileTextOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { formatUnits, parseUnits } from 'viem';
import { STABLECOIN_DECIMALS, STABLECOIN_SYMBOL } from '../constants';

const { Title, Text, Paragraph } = Typography;

// ABI for InvoiceNFT contract
const INVOICE_NFT_ABI = [
  {
    "inputs": [{"type": "uint256", "name": "tokenId"}],
    "name": "getInvoice",
    "outputs": [{
      "type": "tuple",
      "components": [
        {"type": "uint256", "name": "escrowId"},
        {"type": "uint256", "name": "amount"},
        {"type": "uint256", "name": "dueDate"},
        {"type": "address", "name": "issuer"},
        {"type": "address", "name": "payer"},
        {"type": "address", "name": "currentOwner"},
        {"type": "uint8", "name": "status"},
        {"type": "uint256", "name": "listedPrice"},
        {"type": "uint256", "name": "createdAt"}
      ]
    }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "address", "name": "owner"}],
    "name": "getInvoicesByOwner",
    "outputs": [{"type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "uint256", "name": "tokenId"}, {"type": "uint256", "name": "price"}],
    "name": "listInvoiceForSale",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "uint256", "name": "tokenId"}, {"type": "uint256", "name": "newPrice"}],
    "name": "updateListingPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "uint256", "name": "tokenId"}],
    "name": "unlistInvoice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Invoice status enum mapping
const InvoiceStatus = {
  0: { label: 'Active', color: 'green', icon: <CheckCircleOutlined /> },
  1: { label: 'Released', color: 'blue', icon: <DollarOutlined /> },
  2: { label: 'Refunded', color: 'red', icon: <SwapOutlined /> },
  3: { label: 'Listed', color: 'purple', icon: <ShopOutlined /> }
};

// Calculate APR for buyer preview
const calculateBuyerAPR = (amount, price, dueDate) => {
  const now = Date.now() / 1000;
  const daysUntilDue = Math.max(1, (Number(dueDate) - now) / (60 * 60 * 24));
  const profit = amount - price;
  if (price <= 0) return 0;
  return (profit / price) * (365 / daysUntilDue) * 100;
};

// Format date
const formatDate = (timestamp) => {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Invoice Card for Seller
const SellerInvoiceCard = ({ invoice, onList, onUnlist, onUpdatePrice }) => {
  const amount = Number(formatUnits(invoice.amount, STABLECOIN_DECIMALS));
  const listedPrice = invoice.listedPrice ? Number(formatUnits(invoice.listedPrice, STABLECOIN_DECIMALS)) : 0;
  const isListed = invoice.status === 3;
  const status = InvoiceStatus[invoice.status] || InvoiceStatus[0];
  const now = Date.now() / 1000;
  const daysUntilDue = Math.max(0, (Number(invoice.dueDate) - now) / (60 * 60 * 24));

  return (
    <div
      style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        border: `1px solid ${isListed ? 'var(--neon-purple)' : 'var(--border-primary)'}`,
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
      }}
      className="seller-invoice-card"
    >
      {/* Header */}
      <div
        style={{
          background: isListed
            ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(255, 0, 255, 0.1))'
            : 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(168, 85, 247, 0.05))',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Text style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--neon-cyan)', fontSize: '18px', fontWeight: 600 }}>
            INV #{invoice.tokenId}
          </Text>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Escrow #{invoice.escrowId}
          </div>
        </div>
        <Tag icon={status.icon} color={status.color} style={{ fontWeight: 600, fontSize: '12px', padding: '4px 10px' }}>
          {status.label}
        </Tag>
      </div>

      {/* Body */}
      <div style={{ padding: '20px' }}>
        {/* Amount */}
        <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '16px', marginBottom: '16px', textAlign: 'center' }}>
          <Text style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Invoice Value
          </Text>
          <div style={{ color: 'var(--neon-cyan)', fontSize: '28px', fontWeight: 700, fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}>
            ${amount.toLocaleString()}
          </div>
        </div>

        {/* Listed Price (if listed) */}
        {isListed && (
          <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid var(--neon-purple)', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: 'var(--neon-purple)', fontSize: '11px', textTransform: 'uppercase' }}>
                  <TagOutlined /> Listed Price
                </Text>
                <div style={{ color: 'var(--neon-green)', fontSize: '20px', fontWeight: 700 }}>
                  ${listedPrice.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Discount</Text>
                <div style={{ color: 'var(--neon-green)', fontSize: '18px', fontWeight: 600 }}>
                  {((amount - listedPrice) / amount * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <Text style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}><ClockCircleOutlined /> Due Date</Text>
            <Text style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{formatDate(invoice.dueDate)}</Text>
          </div>
          <div>
            <Text style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Days Left</Text>
            <Text style={{ color: daysUntilDue < 7 ? 'var(--neon-red)' : 'var(--neon-green)', fontWeight: 500 }}>
              {Math.floor(daysUntilDue)} days
            </Text>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          {isListed ? (
            <>
              <Button type="default" icon={<EditOutlined />} onClick={() => onUpdatePrice(invoice)} style={{ flex: 1, border: '1px solid var(--neon-cyan)', color: 'var(--neon-cyan)' }}>
                Update Price
              </Button>
              <Button type="default" danger icon={<StopOutlined />} onClick={() => onUnlist(invoice)} style={{ flex: 1 }}>
                Unlist
              </Button>
            </>
          ) : (
            <Button
              type="primary" size="large" block icon={<ShopOutlined />} onClick={() => onList(invoice)}
              style={{ height: '48px', fontSize: '16px', fontWeight: 600, background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', border: 'none', borderRadius: '12px' }}
            >
              List for Sale
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default function InvoicesPage() {
  const { message } = App.useApp();
  const { address, isConnected } = useWalletAddress();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [updatePriceModalVisible, setUpdatePriceModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(10);
  const [newPrice, setNewPrice] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (isConnected && address) {
      loadInvoices();
    } else {
      setLoading(false);
    }
  }, [isConnected, address]);

  const loadInvoices = async () => {
    if (!address) return;
    try {
      setLoading(true);
      const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS;

      console.log('🔍 DEBUG: Loading invoices for wallet:', address);
      console.log('🔍 DEBUG: InvoiceNFT contract address:', invoiceNFTAddress);
      console.log('');
      console.log('📋 KNOWN WALLETS WITH INVOICES:');
      console.log('   Wallet 1: 0x81e9aA254Ff408458A7267Df3469198f5045A561 (has Invoice #2 - 100 USDT)');
      console.log('   Wallet 2: 0x208B2660e5F62CDca21869b389c5aF9E7f0faE89 (has Invoice #3 - 400 USDT)');
      console.log('');
      console.log('⚠️  YOUR WALLET:', address);
      console.log('⚠️  Does your wallet match one of the above? (case-insensitive)');
      const hasMatch = address?.toLowerCase() === '0x81e9aA254Ff408458A7267Df3469198f5045A561'.toLowerCase() ||
                       address?.toLowerCase() === '0x208B2660e5F62CDca21869b389c5aF9E7f0faE89'.toLowerCase();
      console.log(hasMatch ? '✅ MATCH FOUND!' : '❌ NO MATCH - This wallet has no invoices');
      console.log('');

      if (!invoiceNFTAddress) { message.warning('Invoice NFT contract not deployed yet'); setLoading(false); return; }

      const { createPublicClient, http } = await import('viem');
      const { ACTIVE_CHAIN } = await import('../constants');
      const publicClient = createPublicClient({ chain: ACTIVE_CHAIN, transport: http() });

      console.log('🔍 DEBUG: Calling getInvoicesByOwner...');
      console.log('🔍 DEBUG: Exact address being queried:', address);
      console.log('🔍 DEBUG: Address lowercase:', address.toLowerCase());
      console.log('🔍 DEBUG: Expected address lowercase:', '0x208B2660e5F62CDca21869b389c5aF9E7f0faE89'.toLowerCase());
      console.log('🔍 DEBUG: Addresses match?', address.toLowerCase() === '0x208B2660e5F62CDca21869b389c5aF9E7f0faE89'.toLowerCase());

      const tokenIds = await publicClient.readContract({ address: invoiceNFTAddress, abi: INVOICE_NFT_ABI, functionName: 'getInvoicesByOwner', args: [address] });
      console.log('🔍 DEBUG: Token IDs returned:', tokenIds.map(id => id.toString()).join(', ') || 'NONE');
      console.log('🔍 DEBUG: Token IDs array length:', tokenIds.length);

      const invoicesData = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const invoice = await publicClient.readContract({ address: invoiceNFTAddress, abi: INVOICE_NFT_ABI, functionName: 'getInvoice', args: [tokenId] });
          return {
            tokenId: tokenId.toString(), escrowId: invoice.escrowId.toString(), amount: invoice.amount,
            dueDate: invoice.dueDate, issuer: invoice.issuer, payer: invoice.payer, currentOwner: invoice.currentOwner,
            status: Number(invoice.status), listedPrice: invoice.listedPrice, createdAt: invoice.createdAt
          };
        })
      );

      console.log('✅ DEBUG: Successfully loaded', invoicesData.length, 'invoices');
      setInvoices(invoicesData);
    } catch (error) {
      console.error('❌ ERROR loading invoices:', error);
      console.error('Error details:', error.message, error.cause);
      message.error('Failed to load your invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleListClick = (invoice) => { setSelectedInvoice(invoice); setDiscountPercent(10); setListModalVisible(true); };
  const handleUpdatePriceClick = (invoice) => { setSelectedInvoice(invoice); setNewPrice(Number(formatUnits(invoice.listedPrice, STABLECOIN_DECIMALS))); setUpdatePriceModalVisible(true); };

  const handleListInvoice = async () => {
    if (!selectedInvoice || !address) return;
    try {
      setProcessing(true);
      message.loading({ content: 'Listing invoice for sale...', key: 'list' });

      const { createWalletClient, custom, createPublicClient, http } = await import('viem');
      const { ACTIVE_CHAIN } = await import('../constants');
      const walletClient = createWalletClient({ chain: ACTIVE_CHAIN, transport: custom(window.ethereum) });
      const publicClient = createPublicClient({ chain: ACTIVE_CHAIN, transport: http() });

      const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS;
      const amount = Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS));
      const listPrice = amount * (1 - discountPercent / 100);
      const listPriceWei = parseUnits(listPrice.toFixed(6), STABLECOIN_DECIMALS);

      const tx = await walletClient.writeContract({ address: invoiceNFTAddress, abi: INVOICE_NFT_ABI, functionName: 'listInvoiceForSale', args: [BigInt(selectedInvoice.tokenId), listPriceWei], account: address });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      message.success({ content: 'Invoice listed successfully!', key: 'list' });
      setListModalVisible(false);
      loadInvoices();
    } catch (error) {
      console.error('Error listing invoice:', error);
      message.error({ content: error.message || 'Failed to list invoice', key: 'list' });
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdatePrice = async () => {
    if (!selectedInvoice || !address) return;
    try {
      setProcessing(true);
      message.loading({ content: 'Updating listing price...', key: 'update' });

      const { createWalletClient, custom, createPublicClient, http } = await import('viem');
      const { ACTIVE_CHAIN } = await import('../constants');
      const walletClient = createWalletClient({ chain: ACTIVE_CHAIN, transport: custom(window.ethereum) });
      const publicClient = createPublicClient({ chain: ACTIVE_CHAIN, transport: http() });

      const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS;
      const newPriceWei = parseUnits(newPrice.toFixed(6), STABLECOIN_DECIMALS);

      const tx = await walletClient.writeContract({ address: invoiceNFTAddress, abi: INVOICE_NFT_ABI, functionName: 'updateListingPrice', args: [BigInt(selectedInvoice.tokenId), newPriceWei], account: address });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      message.success({ content: 'Price updated successfully!', key: 'update' });
      setUpdatePriceModalVisible(false);
      loadInvoices();
    } catch (error) {
      console.error('Error updating price:', error);
      message.error({ content: error.message || 'Failed to update price', key: 'update' });
    } finally {
      setProcessing(false);
    }
  };

  const handleUnlist = async (invoice) => {
    try {
      message.loading({ content: 'Unlisting invoice...', key: 'unlist' });

      const { createWalletClient, custom, createPublicClient, http } = await import('viem');
      const { ACTIVE_CHAIN } = await import('../constants');
      const walletClient = createWalletClient({ chain: ACTIVE_CHAIN, transport: custom(window.ethereum) });
      const publicClient = createPublicClient({ chain: ACTIVE_CHAIN, transport: http() });

      const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS;
      const tx = await walletClient.writeContract({ address: invoiceNFTAddress, abi: INVOICE_NFT_ABI, functionName: 'unlistInvoice', args: [BigInt(invoice.tokenId)], account: address });
      await publicClient.waitForTransactionReceipt({ hash: tx });

      message.success({ content: 'Invoice unlisted successfully!', key: 'unlist' });
      loadInvoices();
    } catch (error) {
      console.error('Error unlisting invoice:', error);
      message.error({ content: error.message || 'Failed to unlist invoice', key: 'unlist' });
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return inv.status === 0;
    if (activeTab === 'listed') return inv.status === 3;
    return true;
  });

  const listPreview = selectedInvoice ? {
    amount: Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)),
    listPrice: Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)) * (1 - discountPercent / 100),
    buyerProfit: Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)) * (discountPercent / 100),
    buyerAPR: calculateBuyerAPR(Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)), Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)) * (1 - discountPercent / 100), selectedInvoice.dueDate)
  } : null;

  if (!isConnected) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center', marginTop: '100px' }}>
        <WalletOutlined style={{ fontSize: '64px', color: 'var(--neon-cyan)', marginBottom: '24px' }} />
        <Title level={2} style={{ color: 'var(--text-primary)' }}>Connect Your Wallet</Title>
        <Paragraph style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Connect your wallet to view and manage your invoices</Paragraph>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title level={1} style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '42px', fontWeight: 800, marginBottom: '16px' }}>
          <span style={{ background: 'linear-gradient(90deg, #00f0ff 0%, #ff00ff 50%, #a855f7 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            My Invoices
          </span>
        </Title>
        <Paragraph style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
          Manage your invoice NFTs. List them for sale to get instant liquidity or hold them to receive full payment on escrow release.
        </Paragraph>
      </div>

      {/* Info Alert */}
      <Alert
        message={<span style={{ fontWeight: 600, color: 'var(--text-primary)' }}><ThunderboltOutlined /> Invoice Factoring</span>}
        description={<span style={{ color: 'var(--text-secondary)' }}>List your invoices at a discount to receive immediate payment. Buyers purchase your invoices and receive the full amount when the escrow is released.</span>}
        type="info" showIcon={false}
        style={{ background: 'rgba(0, 240, 255, 0.05)', border: '1px solid var(--neon-cyan)', borderRadius: '12px', marginBottom: '32px' }}
      />

      {/* Stats Row */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={8}>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Total Invoices</div>
            <div style={{ color: 'var(--neon-cyan)', fontSize: '32px', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>{invoices.length}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Listed for Sale</div>
            <div style={{ color: 'var(--neon-purple)', fontSize: '32px', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>{invoices.filter(i => i.status === 3).length}</div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '4px' }}>Total Value</div>
            <div style={{ color: 'var(--neon-green)', fontSize: '32px', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
              ${invoices.reduce((sum, inv) => sum + Number(formatUnits(inv.amount, STABLECOIN_DECIMALS)), 0).toLocaleString()}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} style={{ marginBottom: '24px' }} items={[
        { key: 'all', label: `All (${invoices.length})` },
        { key: 'active', label: `Available (${invoices.filter(i => i.status === 0).length})` },
        { key: 'listed', label: `Listed (${invoices.filter(i => i.status === 3).length})` },
      ]} />

      {/* Invoice Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Loading your invoices...</div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={<span style={{ color: 'var(--text-secondary)' }}>{invoices.length === 0 ? "You don't have any invoice NFTs yet" : "No invoices match this filter"}</span>} />
          {invoices.length === 0 && <Button type="primary" icon={<FileTextOutlined />} size="large" href="/escrow" style={{ marginTop: '24px' }}>Create an Escrow</Button>}
        </div>
      ) : (
        <Row gutter={[20, 20]}>
          {filteredInvoices.map((invoice) => (
            <Col xs={24} sm={12} lg={8} key={invoice.tokenId}>
              <SellerInvoiceCard invoice={invoice} onList={handleListClick} onUnlist={handleUnlist} onUpdatePrice={handleUpdatePriceClick} />
            </Col>
          ))}
        </Row>
      )}

      {/* List Modal */}
      <Modal
        title={<span style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--neon-cyan)' }}><ShopOutlined /> List Invoice for Sale</span>}
        open={listModalVisible} onOk={handleListInvoice} onCancel={() => setListModalVisible(false)}
        okText={processing ? 'Processing...' : 'List for Sale'} okButtonProps={{ loading: processing, disabled: processing }} width={520}
      >
        {selectedInvoice && listPreview && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Invoice</Text>
                <Text style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--neon-cyan)' }}>#{selectedInvoice.tokenId}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Face Value</Text>
                <Text style={{ color: 'var(--text-primary)', fontSize: '18px', fontWeight: 600 }}>${listPreview.amount.toLocaleString()} {STABLECOIN_SYMBOL}</Text>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text style={{ color: 'var(--text-secondary)' }}><TagOutlined /> Set Discount</Text>
                <Text style={{ color: 'var(--neon-green)', fontWeight: 600, fontSize: '18px' }}>{discountPercent}%</Text>
              </div>
              <Slider min={1} max={30} step={0.5} value={discountPercent} onChange={setDiscountPercent} tooltip={{ formatter: (val) => `${val}% discount` }} />
            </div>

            <div style={{ background: 'rgba(0, 255, 136, 0.08)', border: '1px solid var(--neon-green)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <Text style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>You Will Receive</Text>
                <div style={{ color: 'var(--neon-green)', fontSize: '36px', fontWeight: 700, fontFamily: "'Orbitron', sans-serif", textShadow: '0 0 20px rgba(0, 255, 136, 0.3)' }}>
                  ${listPreview.listPrice.toFixed(2)}
                </div>
              </div>
              <Divider style={{ margin: '16px 0', borderColor: 'var(--border-primary)' }} />
              <Row gutter={16}>
                <Col span={12}><div style={{ textAlign: 'center' }}><Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Buyer Profit</Text><div style={{ color: 'var(--neon-purple)', fontWeight: 600, fontSize: '16px' }}>+${listPreview.buyerProfit.toFixed(2)}</div></div></Col>
                <Col span={12}><div style={{ textAlign: 'center' }}><Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Buyer APR</Text><div style={{ color: 'var(--neon-purple)', fontWeight: 600, fontSize: '16px' }}>{listPreview.buyerAPR > 1000 ? '>1000' : listPreview.buyerAPR.toFixed(0)}%</div></div></Col>
              </Row>
            </div>

            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '8px', padding: '12px 16px' }}>
              <Text style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                <InfoCircleOutlined /> Higher discounts attract more buyers. 1% platform fee applies when sold.
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Update Price Modal */}
      <Modal
        title={<span style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--neon-cyan)' }}><EditOutlined /> Update Listing Price</span>}
        open={updatePriceModalVisible} onOk={handleUpdatePrice} onCancel={() => setUpdatePriceModalVisible(false)}
        okText={processing ? 'Processing...' : 'Update Price'} okButtonProps={{ loading: processing, disabled: processing }} width={450}
      >
        {selectedInvoice && (
          <div style={{ padding: '16px 0' }}>
            <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Invoice</Text>
                <Text style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--neon-cyan)' }}>#{selectedInvoice.tokenId}</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Face Value</Text>
                <Text style={{ color: 'var(--text-primary)', fontWeight: 500 }}>${Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)).toLocaleString()}</Text>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <Text style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>New Price ({STABLECOIN_SYMBOL})</Text>
              <InputNumber value={newPrice} onChange={setNewPrice} min={0} max={Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)) - 1} style={{ width: '100%' }} size="large" prefix="$" />
            </div>
            {newPrice > 0 && (
              <div style={{ background: 'rgba(0, 255, 136, 0.08)', border: '1px solid var(--neon-green)', borderRadius: '8px', padding: '12px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text style={{ color: 'var(--text-secondary)' }}>New Discount</Text>
                  <Text style={{ color: 'var(--neon-green)', fontWeight: 600 }}>{((Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)) - newPrice) / Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)) * 100).toFixed(1)}%</Text>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <style jsx global>{`
        .seller-invoice-card:hover {
          border-color: var(--neon-cyan) !important;
          box-shadow: var(--glow-cyan), 0 8px 32px rgba(0, 0, 0, 0.4);
          transform: translateY(-4px);
        }
      `}</style>
    </div>
  );
}
