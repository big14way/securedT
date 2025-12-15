'use client';

import { useState, useEffect, useMemo } from 'react';
import { App, Card, Row, Col, Statistic, Button, Tag, Modal, Spin, Empty, Typography, Space, Slider, Select, Input, Tooltip, Progress, Segmented, Badge } from 'antd';
import {
  DollarOutlined,
  ClockCircleOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  RiseOutlined,
  FireOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SearchOutlined,
  SafetyOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { formatUnits, parseUnits } from 'viem';
import { STABLECOIN_DECIMALS, STABLECOIN_SYMBOL } from '../constants';

const { Title, Text, Paragraph } = Typography;

// ABI for InvoiceNFT V2 contract with purchaseInvoice
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
    "inputs": [],
    "name": "getListedInvoices",
    "outputs": [{"type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "uint256", "name": "tokenId"}],
    "name": "calculateDiscount",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "uint256", "name": "tokenId"}],
    "name": "calculatePotentialReturn",
    "outputs": [{"type": "uint256", "name": "profit"}, {"type": "uint256", "name": "aprBps"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"type": "uint256", "name": "tokenId"}],
    "name": "purchaseInvoice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getMarketStats",
    "outputs": [{
      "type": "tuple",
      "components": [
        {"type": "uint256", "name": "totalVolume"},
        {"type": "uint256", "name": "totalSales"},
        {"type": "uint256", "name": "totalListings"},
        {"type": "uint256", "name": "highestSale"}
      ]
    }],
    "stateMutability": "view",
    "type": "function"
  }
];

// ERC20 ABI for stablecoin approval
const ERC20_ABI = [
  {
    "inputs": [{"type": "address", "name": "spender"}, {"type": "uint256", "name": "amount"}],
    "name": "approve",
    "outputs": [{"type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "address", "name": "account"}],
    "name": "balanceOf",
    "outputs": [{"type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Calculate risk level based on due date proximity
const calculateRiskLevel = (dueDate) => {
  const now = Date.now() / 1000;
  const daysUntilDue = (Number(dueDate) - now) / (60 * 60 * 24);

  if (daysUntilDue < 0) return { level: 5, text: 'Overdue', color: '#ff0055' };
  if (daysUntilDue < 7) return { level: 4, text: 'High Risk', color: '#ff6b35' };
  if (daysUntilDue < 14) return { level: 3, text: 'Medium', color: '#fbbf24' };
  if (daysUntilDue < 30) return { level: 2, text: 'Low Risk', color: '#00ff88' };
  return { level: 1, text: 'Safe', color: '#00f0ff' };
};

// Format time remaining
const formatTimeRemaining = (dueDate) => {
  const now = Date.now() / 1000;
  const diff = Number(dueDate) - now;

  if (diff < 0) return 'Overdue';

  const days = Math.floor(diff / (60 * 60 * 24));
  const hours = Math.floor((diff % (60 * 60 * 24)) / (60 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h`;
};

// Invoice Card Component
const InvoiceCard = ({ invoice, onPurchase, isOwner, viewMode }) => {
  const risk = calculateRiskLevel(invoice.dueDate);
  const timeRemaining = formatTimeRemaining(invoice.dueDate);
  const amount = Number(formatUnits(invoice.amount, STABLECOIN_DECIMALS));
  const price = Number(formatUnits(invoice.listedPrice, STABLECOIN_DECIMALS));
  const profit = amount - price;
  const apr = invoice.apr || 0;

  if (viewMode === 'list') {
    return (
      <div
        style={{
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
        className="invoice-list-item"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
          <div style={{ minWidth: '80px' }}>
            <Text style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--neon-cyan)', fontSize: '14px' }}>
              #{invoice.tokenId}
            </Text>
          </div>

          <div style={{ minWidth: '120px' }}>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Amount</Text>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
              ${amount.toLocaleString()}
            </div>
          </div>

          <div style={{ minWidth: '120px' }}>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Buy Price</Text>
            <div style={{ color: 'var(--neon-green)', fontWeight: 700, fontSize: '16px' }}>
              ${price.toLocaleString()}
            </div>
          </div>

          <div style={{ minWidth: '80px' }}>
            <Tag
              style={{
                background: 'rgba(0, 255, 136, 0.15)',
                border: '1px solid var(--neon-green)',
                color: 'var(--neon-green)',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              -{invoice.discount}%
            </Tag>
          </div>

          <div style={{ minWidth: '100px' }}>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Profit</Text>
            <div style={{ color: 'var(--neon-green)', fontWeight: 600 }}>
              +${profit.toFixed(2)}
            </div>
          </div>

          <div style={{ minWidth: '80px' }}>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>APR</Text>
            <div style={{ color: 'var(--neon-purple)', fontWeight: 600 }}>
              {apr > 1000 ? '>1000' : apr.toFixed(0)}%
            </div>
          </div>

          <div style={{ minWidth: '100px' }}>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Due In</Text>
            <div style={{ color: risk.color, fontWeight: 500 }}>
              <ClockCircleOutlined /> {timeRemaining}
            </div>
          </div>

          <div style={{ minWidth: '80px' }}>
            <Tooltip title={risk.text}>
              <Progress
                percent={(5 - risk.level) * 25}
                size="small"
                showInfo={false}
                strokeColor={risk.color}
                trailColor="var(--bg-tertiary)"
              />
            </Tooltip>
          </div>
        </div>

        <Button
          type="primary"
          icon={<ShoppingCartOutlined />}
          onClick={() => onPurchase(invoice)}
          disabled={isOwner}
          style={{
            background: isOwner ? 'var(--bg-tertiary)' : 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
            border: 'none',
          }}
        >
          {isOwner ? 'Yours' : 'Buy'}
        </Button>
      </div>
    );
  }

  // Grid view card
  return (
    <div
      style={{
        background: 'var(--bg-glass)',
        backdropFilter: 'blur(20px)',
        border: '1px solid var(--border-primary)',
        borderRadius: '16px',
        overflow: 'hidden',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        height: '100%',
      }}
      className="invoice-card"
    >
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.1), rgba(168, 85, 247, 0.1))',
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <Text style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--neon-cyan)', fontSize: '16px', fontWeight: 600 }}>
            INV #{invoice.tokenId}
          </Text>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Escrow #{invoice.escrowId}
          </div>
        </div>
        <Tag
          style={{
            background: 'rgba(0, 255, 136, 0.2)',
            border: '1px solid var(--neon-green)',
            color: 'var(--neon-green)',
            fontWeight: 700,
            fontSize: '16px',
            padding: '4px 12px',
            borderRadius: '20px',
          }}
        >
          -{invoice.discount}%
        </Tag>
      </div>

      {/* Body */}
      <div style={{ padding: '20px' }}>
        {/* Amount & Price */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Face Value</Text>
            <Text style={{ color: 'var(--text-primary)', fontWeight: 500, textDecoration: 'line-through', opacity: 0.6 }}>
              ${amount.toLocaleString()}
            </Text>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>Buy Now</Text>
            <Text style={{
              color: 'var(--neon-green)',
              fontWeight: 700,
              fontSize: '24px',
              fontFamily: "'Orbitron', sans-serif",
              textShadow: '0 0 20px rgba(0, 255, 136, 0.3)',
            }}>
              ${price.toLocaleString()}
            </Text>
          </div>
        </div>

        {/* Profit Box */}
        <div
          style={{
            background: 'rgba(0, 255, 136, 0.08)',
            border: '1px solid rgba(0, 255, 136, 0.3)',
            borderRadius: '12px',
            padding: '12px 16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Text style={{ color: 'var(--neon-green)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Potential Profit
              </Text>
              <div style={{ color: 'var(--neon-green)', fontSize: '20px', fontWeight: 700 }}>
                +${profit.toFixed(2)}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Text style={{ color: 'var(--neon-purple)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                APR
              </Text>
              <div style={{ color: 'var(--neon-purple)', fontSize: '20px', fontWeight: 700 }}>
                {apr > 1000 ? '>1000' : apr.toFixed(0)}%
              </div>
            </div>
          </div>
        </div>

        {/* Due Date & Risk */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
              <ClockCircleOutlined /> Due In
            </Text>
            <div style={{ color: risk.color, fontWeight: 600, fontSize: '14px' }}>
              {timeRemaining}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>Risk Level</Text>
            <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    width: '8px',
                    height: '16px',
                    borderRadius: '2px',
                    background: i <= risk.level ? risk.color : 'var(--bg-tertiary)',
                    transition: 'all 0.3s ease',
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Issuer */}
        <div style={{ marginBottom: '16px' }}>
          <Text style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
            <UserOutlined /> Seller
          </Text>
          <div style={{ color: 'var(--text-secondary)', fontSize: '12px', fontFamily: "'JetBrains Mono', monospace" }}>
            {invoice.currentOwner?.substring(0, 8)}...{invoice.currentOwner?.substring(invoice.currentOwner.length - 6)}
          </div>
        </div>

        {/* Buy Button */}
        <Button
          type="primary"
          size="large"
          block
          icon={isOwner ? <CheckCircleOutlined /> : <ShoppingCartOutlined />}
          onClick={() => onPurchase(invoice)}
          disabled={isOwner}
          style={{
            height: '48px',
            fontSize: '16px',
            fontWeight: 600,
            background: isOwner
              ? 'var(--bg-tertiary)'
              : 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))',
            border: 'none',
            borderRadius: '12px',
          }}
        >
          {isOwner ? 'Your Invoice' : 'Purchase Invoice'}
        </Button>
      </div>
    </div>
  );
};

export default function MarketplacePage() {
  const { message } = App.useApp();
  const { address, isConnected } = useWalletAddress();
  const [listedInvoices, setListedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('discount');
  const [searchTerm, setSearchTerm] = useState('');
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [discountRange, setDiscountRange] = useState([0, 50]);
  const [showFilters, setShowFilters] = useState(false);
  const [marketStats, setMarketStats] = useState({
    totalListed: 0,
    totalVolume: 0,
    avgDiscount: 0,
    totalSales: 0,
  });

  useEffect(() => {
    loadListedInvoices();
  }, []);

  const loadListedInvoices = async () => {
    try {
      setLoading(true);

      const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS;

      if (!invoiceNFTAddress) {
        message.warning('Invoice NFT contract not deployed yet');
        setLoading(false);
        return;
      }

      const { createPublicClient, http } = await import('viem');
      const { ACTIVE_CHAIN } = await import('../constants');

      const publicClient = createPublicClient({
        chain: ACTIVE_CHAIN,
        transport: http()
      });

      // Get all listed invoice token IDs
      const tokenIds = await publicClient.readContract({
        address: invoiceNFTAddress,
        abi: INVOICE_NFT_ABI,
        functionName: 'getListedInvoices'
      });

      // Fetch details for each invoice
      const invoicesData = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const invoice = await publicClient.readContract({
            address: invoiceNFTAddress,
            abi: INVOICE_NFT_ABI,
            functionName: 'getInvoice',
            args: [tokenId]
          });

          const discount = await publicClient.readContract({
            address: invoiceNFTAddress,
            abi: INVOICE_NFT_ABI,
            functionName: 'calculateDiscount',
            args: [tokenId]
          });

          // Try to get APR (new V2 function)
          let apr = 0;
          try {
            const [profit, aprBps] = await publicClient.readContract({
              address: invoiceNFTAddress,
              abi: INVOICE_NFT_ABI,
              functionName: 'calculatePotentialReturn',
              args: [tokenId]
            });
            apr = Number(aprBps) / 100;
          } catch (e) {
            // V1 contract doesn't have this function, calculate manually
            const amount = Number(formatUnits(invoice.amount, STABLECOIN_DECIMALS));
            const price = Number(formatUnits(invoice.listedPrice, STABLECOIN_DECIMALS));
            const profit = amount - price;
            const now = Date.now() / 1000;
            const daysUntilDue = Math.max(1, (Number(invoice.dueDate) - now) / (60 * 60 * 24));
            apr = (profit / price) * (365 / daysUntilDue) * 100;
          }

          return {
            tokenId: tokenId.toString(),
            escrowId: invoice.escrowId.toString(),
            amount: invoice.amount,
            listedPrice: invoice.listedPrice,
            dueDate: invoice.dueDate,
            issuer: invoice.issuer,
            payer: invoice.payer,
            currentOwner: invoice.currentOwner,
            discount: Number(discount) / 100,
            createdAt: invoice.createdAt,
            apr
          };
        })
      );

      setListedInvoices(invoicesData);

      // Calculate market stats
      const totalListed = invoicesData.length;
      const totalVolume = invoicesData.reduce((sum, inv) => sum + Number(formatUnits(inv.amount, STABLECOIN_DECIMALS)), 0);
      const avgDiscount = invoicesData.length > 0
        ? invoicesData.reduce((sum, inv) => sum + inv.discount, 0) / invoicesData.length
        : 0;

      setMarketStats({
        totalListed,
        totalVolume: totalVolume.toFixed(2),
        avgDiscount: avgDiscount.toFixed(2),
        totalSales: 0
      });

    } catch (error) {
      console.error('Error loading listed invoices:', error);
      message.error('Failed to load marketplace invoices');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort invoices
  const filteredInvoices = useMemo(() => {
    let result = [...listedInvoices];

    // Search filter
    if (searchTerm) {
      result = result.filter(inv =>
        inv.tokenId.includes(searchTerm) ||
        inv.escrowId.includes(searchTerm) ||
        inv.currentOwner?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Price range filter
    result = result.filter(inv => {
      const price = Number(formatUnits(inv.listedPrice, STABLECOIN_DECIMALS));
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Discount range filter
    result = result.filter(inv =>
      inv.discount >= discountRange[0] && inv.discount <= discountRange[1]
    );

    // Sort
    switch (sortBy) {
      case 'discount':
        result.sort((a, b) => b.discount - a.discount);
        break;
      case 'price_low':
        result.sort((a, b) => Number(a.listedPrice) - Number(b.listedPrice));
        break;
      case 'price_high':
        result.sort((a, b) => Number(b.listedPrice) - Number(a.listedPrice));
        break;
      case 'apr':
        result.sort((a, b) => b.apr - a.apr);
        break;
      case 'due_soon':
        result.sort((a, b) => Number(a.dueDate) - Number(b.dueDate));
        break;
      default:
        break;
    }

    return result;
  }, [listedInvoices, searchTerm, priceRange, discountRange, sortBy]);

  const handlePurchaseClick = (invoice) => {
    if (!isConnected) {
      message.warning('Please connect your wallet to purchase');
      return;
    }
    setSelectedInvoice(invoice);
    setPurchaseModalVisible(true);
  };

  const handlePurchaseInvoice = async () => {
    if (!selectedInvoice || !address) return;

    try {
      setPurchasing(true);
      message.loading({ content: 'Preparing purchase...', key: 'purchase' });

      const { createWalletClient, custom } = await import('viem');
      const { ACTIVE_CHAIN, STABLECOIN_ADDRESS } = await import('../constants');

      const walletClient = createWalletClient({
        chain: ACTIVE_CHAIN,
        transport: custom(window.ethereum)
      });

      const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS;
      const listedPrice = selectedInvoice.listedPrice;

      // Step 1: Approve stablecoin transfer to contract
      message.loading({ content: 'Step 1/2: Approving USDT...', key: 'purchase' });

      const approveTx = await walletClient.writeContract({
        address: STABLECOIN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [invoiceNFTAddress, listedPrice],
        account: address
      });

      // Wait for approval
      const { createPublicClient, http } = await import('viem');
      const publicClient = createPublicClient({
        chain: ACTIVE_CHAIN,
        transport: http()
      });
      await publicClient.waitForTransactionReceipt({ hash: approveTx });

      // Step 2: Purchase invoice (atomic swap)
      message.loading({ content: 'Step 2/2: Purchasing invoice...', key: 'purchase' });

      const purchaseTx = await walletClient.writeContract({
        address: invoiceNFTAddress,
        abi: INVOICE_NFT_ABI,
        functionName: 'purchaseInvoice',
        args: [BigInt(selectedInvoice.tokenId)],
        account: address
      });

      await publicClient.waitForTransactionReceipt({ hash: purchaseTx });

      message.success({ content: 'Invoice purchased successfully!', key: 'purchase' });
      setPurchaseModalVisible(false);
      loadListedInvoices();

    } catch (error) {
      console.error('Error purchasing invoice:', error);
      message.error({ content: error.message || 'Failed to purchase invoice', key: 'purchase' });
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
      {/* Hero Section */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <Title
          level={1}
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '42px',
            fontWeight: 800,
            marginBottom: '16px',
          }}
        >
          <span style={{
            background: 'linear-gradient(90deg, #00f0ff 0%, #ff00ff 50%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Invoice Marketplace
          </span>
        </Title>
        <Paragraph style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto' }}>
          Trade tokenized invoices with instant liquidity. Purchase discounted invoices for guaranteed profits on escrow release.
        </Paragraph>
      </div>

      {/* Market Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Active Listings</span>}
              value={marketStats.totalListed}
              prefix={<ShoppingCartOutlined style={{ color: 'var(--neon-cyan)' }} />}
              valueStyle={{ color: 'var(--neon-cyan)', fontFamily: "'Orbitron', sans-serif" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Total Value</span>}
              value={marketStats.totalVolume}
              prefix={<DollarOutlined style={{ color: 'var(--neon-green)' }} />}
              suffix={STABLECOIN_SYMBOL}
              valueStyle={{ color: 'var(--neon-green)', fontFamily: "'Orbitron', sans-serif" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Avg Discount</span>}
              value={marketStats.avgDiscount}
              prefix={<FireOutlined style={{ color: 'var(--neon-magenta)' }} />}
              suffix="%"
              valueStyle={{ color: 'var(--neon-magenta)', fontFamily: "'Orbitron', sans-serif" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card style={{ textAlign: 'center' }}>
            <Statistic
              title={<span style={{ color: 'var(--text-secondary)' }}>Platform Fee</span>}
              value={1}
              prefix={<SafetyOutlined style={{ color: 'var(--neon-purple)' }} />}
              suffix="%"
              valueStyle={{ color: 'var(--neon-purple)', fontFamily: "'Orbitron', sans-serif" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Controls Bar */}
      <div
        style={{
          background: 'var(--bg-glass)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-primary)',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '16px',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Input
            placeholder="Search by ID or address..."
            prefix={<SearchOutlined style={{ color: 'var(--text-muted)' }} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '220px' }}
          />

          <Select
            value={sortBy}
            onChange={setSortBy}
            style={{ width: '160px' }}
            options={[
              { value: 'discount', label: 'Highest Discount' },
              { value: 'apr', label: 'Highest APR' },
              { value: 'price_low', label: 'Lowest Price' },
              { value: 'price_high', label: 'Highest Price' },
              { value: 'due_soon', label: 'Due Soonest' },
            ]}
          />

          <Button
            icon={<FilterOutlined />}
            onClick={() => setShowFilters(!showFilters)}
            type={showFilters ? 'primary' : 'default'}
          >
            Filters
          </Button>

          <Button
            icon={<SyncOutlined spin={loading} />}
            onClick={loadListedInvoices}
            disabled={loading}
          >
            Refresh
          </Button>
        </div>

        <Segmented
          value={viewMode}
          onChange={setViewMode}
          options={[
            { value: 'grid', icon: <AppstoreOutlined /> },
            { value: 'list', icon: <UnorderedListOutlined /> },
          ]}
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div
          style={{
            background: 'var(--bg-glass)',
            backdropFilter: 'blur(20px)',
            border: '1px solid var(--border-primary)',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '24px',
          }}
        >
          <Row gutter={[32, 16]}>
            <Col xs={24} md={12}>
              <Text style={{ color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                Price Range: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
              </Text>
              <Slider
                range
                min={0}
                max={100000}
                step={100}
                value={priceRange}
                onChange={setPriceRange}
                tooltip={{ formatter: (val) => `$${val.toLocaleString()}` }}
              />
            </Col>
            <Col xs={24} md={12}>
              <Text style={{ color: 'var(--text-secondary)', marginBottom: '8px', display: 'block' }}>
                Discount Range: {discountRange[0]}% - {discountRange[1]}%
              </Text>
              <Slider
                range
                min={0}
                max={50}
                step={1}
                value={discountRange}
                onChange={setDiscountRange}
                tooltip={{ formatter: (val) => `${val}%` }}
              />
            </Col>
          </Row>
        </div>
      )}

      {/* Invoice Listings */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>
            Loading marketplace...
          </div>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <span style={{ color: 'var(--text-secondary)' }}>
                {listedInvoices.length === 0
                  ? 'No invoices listed for sale yet'
                  : 'No invoices match your filters'}
              </span>
            }
          />
          {listedInvoices.length === 0 && (
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              size="large"
              href="/invoices"
              style={{ marginTop: '24px' }}
            >
              List Your Invoice
            </Button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <Row gutter={[20, 20]}>
          {filteredInvoices.map((invoice) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={invoice.tokenId}>
              <InvoiceCard
                invoice={invoice}
                onPurchase={handlePurchaseClick}
                isOwner={invoice.currentOwner?.toLowerCase() === address?.toLowerCase()}
                viewMode="grid"
              />
            </Col>
          ))}
        </Row>
      ) : (
        <div>
          {filteredInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.tokenId}
              invoice={invoice}
              onPurchase={handlePurchaseClick}
              isOwner={invoice.currentOwner?.toLowerCase() === address?.toLowerCase()}
              viewMode="list"
            />
          ))}
        </div>
      )}

      {/* Purchase Modal */}
      <Modal
        title={
          <span style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--neon-cyan)' }}>
            <ShoppingCartOutlined /> Purchase Invoice
          </span>
        }
        open={purchaseModalVisible}
        onOk={handlePurchaseInvoice}
        onCancel={() => setPurchaseModalVisible(false)}
        okText={purchasing ? 'Processing...' : 'Confirm Purchase'}
        okButtonProps={{ loading: purchasing, disabled: purchasing }}
        width={500}
      >
        {selectedInvoice && (
          <div style={{ padding: '16px 0' }}>
            <div
              style={{
                background: 'var(--bg-tertiary)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Invoice</Text>
                <Text style={{ fontFamily: "'Orbitron', sans-serif", color: 'var(--neon-cyan)' }}>
                  #{selectedInvoice.tokenId}
                </Text>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Face Value</Text>
                <Text style={{ color: 'var(--text-primary)', textDecoration: 'line-through', opacity: 0.6 }}>
                  {formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)} {STABLECOIN_SYMBOL}
                </Text>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>You Pay</Text>
                <Text style={{ color: 'var(--neon-green)', fontSize: '20px', fontWeight: 700 }}>
                  {formatUnits(selectedInvoice.listedPrice, STABLECOIN_DECIMALS)} {STABLECOIN_SYMBOL}
                </Text>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Discount</Text>
                <Tag color="green">{selectedInvoice.discount}%</Tag>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(0, 255, 136, 0.1)',
                border: '1px solid var(--neon-green)',
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Text style={{ color: 'var(--neon-green)', fontWeight: 600 }}>
                    <RiseOutlined /> Guaranteed Profit
                  </Text>
                </div>
                <Text style={{ color: 'var(--neon-green)', fontSize: '24px', fontWeight: 700, fontFamily: "'Orbitron', sans-serif" }}>
                  +${(Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)) -
                    Number(formatUnits(selectedInvoice.listedPrice, STABLECOIN_DECIMALS))).toFixed(2)}
                </Text>
              </div>
              <div style={{ marginTop: '8px' }}>
                <Text style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                  Annualized Return: <span style={{ color: 'var(--neon-purple)', fontWeight: 600 }}>
                    {selectedInvoice.apr > 1000 ? '>1000' : selectedInvoice.apr?.toFixed(0)}% APR
                  </span>
                </Text>
              </div>
            </div>

            <div
              style={{
                background: 'var(--bg-tertiary)',
                borderRadius: '8px',
                padding: '12px 16px',
              }}
            >
              <Text style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                <SafetyOutlined /> By purchasing this invoice, you will own the right to receive the full face value ({formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)} {STABLECOIN_SYMBOL}) when the escrow is released. A 1% platform fee applies.
              </Text>
            </div>
          </div>
        )}
      </Modal>

      {/* Styles for hover effects */}
      <style jsx global>{`
        .invoice-card:hover {
          border-color: var(--neon-cyan) !important;
          box-shadow: var(--glow-cyan), 0 8px 32px rgba(0, 0, 0, 0.4);
          transform: translateY(-4px);
        }
        .invoice-list-item:hover {
          border-color: var(--neon-cyan) !important;
          box-shadow: 0 0 20px rgba(0, 240, 255, 0.2);
          background: rgba(0, 240, 255, 0.03);
        }
      `}</style>
    </div>
  );
}
