'use client';

import { useState, useEffect } from 'react';
import { App, Card, Row, Col, Statistic, Button, Tag, Modal, InputNumber, Spin, Empty, Typography } from 'antd';
import { DollarOutlined, ClockCircleOutlined, UserOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { formatUnits, parseUnits } from 'viem';
import { STABLECOIN_DECIMALS, siteConfig, STABLECOIN_SYMBOL } from '../constants';

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
    "inputs": [{"type": "address", "name": "from"}, {"type": "address", "name": "to"}, {"type": "uint256", "name": "tokenId"}],
    "name": "transferFrom",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "address", "name": "to"}, {"type": "uint256", "name": "tokenId"}],
    "name": "approve",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// ERC20 ABI for stablecoin
const ERC20_ABI = [
  {
    "inputs": [{"type": "address", "name": "spender"}, {"type": "uint256", "name": "amount"}],
    "name": "approve",
    "outputs": [{"type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{"type": "address", "name": "from"}, {"type": "address", "name": "to"}, {"type": "uint256", "name": "amount"}],
    "name": "transferFrom",
    "outputs": [{"type": "bool"}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function MarketplacePage() {
  const { message } = App.useApp();
  const { address, isConnected } = useWalletAddress();
  const [listedInvoices, setListedInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [marketStats, setMarketStats] = useState({
    totalListed: 0,
    totalVolume: 0,
    avgDiscount: 0
  });

  useEffect(() => {
    // Load invoices regardless of connection state - anyone can view the marketplace
    loadListedInvoices();
  }, []);

  const loadListedInvoices = async () => {
    try {
      setLoading(true);
      
      // Get invoice NFT contract address from environment
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

      console.log('Listed token IDs:', tokenIds);

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

          return {
            tokenId: tokenId.toString(),
            escrowId: invoice.escrowId.toString(),
            amount: invoice.amount,
            listedPrice: invoice.listedPrice,
            dueDate: invoice.dueDate,
            issuer: invoice.issuer,
            payer: invoice.payer,
            currentOwner: invoice.currentOwner,
            discount: Number(discount) / 100, // Convert from basis points to percentage
            createdAt: invoice.createdAt
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
        avgDiscount: avgDiscount.toFixed(2)
      });

    } catch (error) {
      console.error('Error loading listed invoices:', error);
      message.error('Failed to load marketplace invoices');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseClick = (invoice) => {
    setSelectedInvoice(invoice);
    setPurchaseModalVisible(true);
  };

  const handlePurchaseInvoice = async () => {
    if (!selectedInvoice || !address) return;

    try {
      message.loading('Purchasing invoice...', 0);

      const { createWalletClient, custom, parseUnits: viemParseUnits } = await import('viem');
      const { ACTIVE_CHAIN, STABLECOIN_ADDRESS } = await import('../constants');
      
      const walletClient = createWalletClient({
        chain: ACTIVE_CHAIN,
        transport: custom(window.ethereum)
      });

      const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS;
      const listedPrice = selectedInvoice.listedPrice;

      // Step 1: Approve stablecoin transfer
      const approveTx = await walletClient.writeContract({
        address: STABLECOIN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [selectedInvoice.currentOwner, listedPrice],
        account: address
      });

      console.log('Approve transaction:', approveTx);

      // Step 2: Transfer stablecoin to current owner
      const transferTx = await walletClient.writeContract({
        address: STABLECOIN_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'transferFrom',
        args: [address, selectedInvoice.currentOwner, listedPrice],
        account: address
      });

      console.log('Payment transaction:', transferTx);

      // Step 3: Transfer NFT ownership
      const nftTransferTx = await walletClient.writeContract({
        address: invoiceNFTAddress,
        abi: INVOICE_NFT_ABI,
        functionName: 'transferFrom',
        args: [selectedInvoice.currentOwner, address, BigInt(selectedInvoice.tokenId)],
        account: address
      });

      console.log('NFT transfer transaction:', nftTransferTx);

      message.destroy();
      message.success('Invoice purchased successfully!');
      setPurchaseModalVisible(false);
      loadListedInvoices();

    } catch (error) {
      message.destroy();
      console.error('Error purchasing invoice:', error);
      message.error(error.message || 'Failed to purchase invoice');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const abbreviateAddress = (addr) => {
    if (!addr) return '';
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2}>Invoice Marketplace</Title>
      <Paragraph>
        Trade tokenized invoices with instant liquidity. Purchase discounted invoices for early payment opportunities.
      </Paragraph>

      {/* Market Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '32px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Listed"
              value={marketStats.totalListed}
              prefix={<ShoppingCartOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title={`Total Volume (${STABLECOIN_SYMBOL})`}
              value={marketStats.totalVolume}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Avg Discount"
              value={marketStats.avgDiscount}
              suffix="%"
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Invoice Listings */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Loading invoices...</div>
        </div>
      ) : listedInvoices.length === 0 ? (
        <Empty
          description="No invoices listed for sale"
          style={{ padding: '60px 0' }}
        />
      ) : (
        <Row gutter={[16, 16]}>
          {listedInvoices.map((invoice) => (
            <Col xs={24} sm={12} lg={8} key={invoice.tokenId}>
              <Card
                title={`Invoice #${invoice.tokenId}`}
                extra={<Tag color="green">{invoice.discount}% OFF</Tag>}
                actions={[
                  <Button
                    key="purchase"
                    type="primary"
                    icon={<ShoppingCartOutlined />}
                    onClick={() => handlePurchaseClick(invoice)}
                    disabled={invoice.currentOwner?.toLowerCase() === address?.toLowerCase()}
                  >
                    {invoice.currentOwner?.toLowerCase() === address?.toLowerCase() ? 'Your Invoice' : 'Purchase'}
                  </Button>
                ]}
              >
                <div style={{ marginBottom: '12px' }}>
                  <Text strong>Original Amount:</Text>
                  <div style={{ fontSize: '20px', color: '#1890ff' }}>
                    {formatUnits(invoice.amount, STABLECOIN_DECIMALS)} {STABLECOIN_SYMBOL}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <Text strong>Listed Price:</Text>
                  <div style={{ fontSize: '24px', color: '#52c41a', fontWeight: 'bold' }}>
                    {formatUnits(invoice.listedPrice, STABLECOIN_DECIMALS)} {STABLECOIN_SYMBOL}
                  </div>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <ClockCircleOutlined /> <Text type="secondary">Due: {formatDate(invoice.dueDate)}</Text>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <UserOutlined /> <Text type="secondary">Issuer: {abbreviateAddress(invoice.issuer)}</Text>
                </div>

                <div style={{ marginBottom: '8px' }}>
                  <Text type="secondary">Owner: {abbreviateAddress(invoice.currentOwner)}</Text>
                </div>

                <div style={{ marginTop: '12px', padding: '8px', background: '#f0f2f5', borderRadius: '4px' }}>
                  <Text strong>Potential Profit: </Text>
                  <Text style={{ color: '#52c41a', fontSize: '16px' }}>
                    {(Number(formatUnits(invoice.amount, STABLECOIN_DECIMALS)) - 
                      Number(formatUnits(invoice.listedPrice, STABLECOIN_DECIMALS))).toFixed(2)} {STABLECOIN_SYMBOL}
                  </Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Purchase Modal */}
      <Modal
        title="Purchase Invoice"
        open={purchaseModalVisible}
        onOk={handlePurchaseInvoice}
        onCancel={() => setPurchaseModalVisible(false)}
        okText="Confirm Purchase"
      >
        {selectedInvoice && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>Invoice #{selectedInvoice.tokenId}</Text>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <Text>Original Amount: </Text>
              <Text strong>{formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)} {STABLECOIN_SYMBOL}</Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text>Purchase Price: </Text>
              <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                {formatUnits(selectedInvoice.listedPrice, STABLECOIN_DECIMALS)} {STABLECOIN_SYMBOL}
              </Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text>Discount: </Text>
              <Tag color="green">{selectedInvoice.discount}%</Tag>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text>Potential Profit: </Text>
              <Text strong style={{ color: '#52c41a' }}>
                {(Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)) - 
                  Number(formatUnits(selectedInvoice.listedPrice, STABLECOIN_DECIMALS))).toFixed(2)} {STABLECOIN_SYMBOL}
              </Text>
            </div>

            <Paragraph type="secondary" style={{ marginTop: '16px' }}>
              By purchasing this invoice, you will own the right to receive the full invoice amount when the escrow is released.
            </Paragraph>
          </div>
        )}
      </Modal>
    </div>
  );
}
