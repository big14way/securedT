'use client';

import { useState, useEffect } from 'react';
import { App, Card, Row, Col, Button, Tag, Modal, InputNumber, Empty, Typography, Statistic, Space } from 'antd';
import { DollarOutlined, ShoppingCartOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useWalletAddress } from '../hooks/useWalletAddress';
import { formatUnits, parseUnits } from 'viem';
import { STABLECOIN_DECIMALS, STABLECOIN_SYMBOL } from '../constants';

const { Title, Text, Paragraph } = Typography;

// ABI for InvoiceNFT contract
const INVOICE_NFT_ABI = [
  {
    "inputs": [{" type": "address", "name": "owner"}],
    "name": "getInvoicesByOwner",
    "outputs": [{type": "uint256[]"}],
    "stateMutability": "view",
    "type": "function"
  },
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
    "inputs": [{"type": "uint256", "name": "tokenId"}, {"type": "uint256", "name": "price"}],
    "name": "listInvoiceForSale",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

export default function MyInvoicesPage() {
  const { message } = App.useApp();
  const { address, isConnected } = useWalletAddress();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [listModalVisible, setListModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [listPrice, setListPrice] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(10);

  useEffect(() => {
    if (address) {
      loadMyInvoices();
    }
  }, [address]);

  const loadMyInvoices = async () => {
    try {
      setLoading(true);

      const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS;

      if (!invoiceNFTAddress) {
        message.warning('Invoice NFT contract not deployed yet');
        return;
      }

      const { createPublicClient, http } = await import('viem');
      const { ACTIVE_CHAIN } = await import('../constants');

      const publicClient = createPublicClient({
        chain: ACTIVE_CHAIN,
        transport: http()
      });

      // Get invoices owned by this address
      const tokenIds = await publicClient.readContract({
        address: invoiceNFTAddress,
        abi: INVOICE_NFT_ABI,
        functionName: 'getInvoicesByOwner',
        args: [address]
      });

      console.log('My Invoice token IDs:', tokenIds);

      // Fetch details for each invoice
      const invoicesData = await Promise.all(
        tokenIds.map(async (tokenId) => {
          const invoice = await publicClient.readContract({
            address: invoiceNFTAddress,
            abi: INVOICE_NFT_ABI,
            functionName: 'getInvoice',
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
            status: Number(invoice.status),
            createdAt: invoice.createdAt
          };
        })
      );

      setInvoices(invoicesData);

    } catch (error) {
      console.error('Error loading my invoices:', error);
      message.error('Failed to load your invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleListClick = (invoice) => {
    setSelectedInvoice(invoice);
    const amount = Number(formatUnits(invoice.amount, STABLECOIN_DECIMALS));
    const defaultPrice = amount * 0.9; // 10% discount
    setListPrice(defaultPrice);
    setDiscountPercent(10);
    setListModalVisible(true);
  };

  const handleDiscountChange = (value) => {
    setDiscountPercent(value);
    if (selectedInvoice) {
      const amount = Number(formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS));
      const newPrice = amount * (1 - value / 100);
      setListPrice(newPrice);
    }
  };

  const handleListInvoice = async () => {
    if (!selectedInvoice || !listPrice) return;

    try {
      message.loading('Listing invoice for sale...', 0);

      const { createWalletClient, custom } = await import('viem');
      const { ACTIVE_CHAIN } = await import('../constants');

      const walletClient = createWalletClient({
        chain: ACTIVE_CHAIN,
        transport: custom(window.ethereum)
      });

      const invoiceNFTAddress = process.env.NEXT_PUBLIC_INVOICE_NFT_ADDRESS;
      const priceInWei = parseUnits(listPrice.toString(), STABLECOIN_DECIMALS);

      const hash = await walletClient.writeContract({
        address: invoiceNFTAddress,
        abi: INVOICE_NFT_ABI,
        functionName: 'listInvoiceForSale',
        args: [BigInt(selectedInvoice.tokenId), priceInWei],
        account: address
      });

      console.log('List transaction:', hash);

      message.destroy();
      message.success('Invoice listed successfully!');
      setListModalVisible(false);
      loadMyInvoices();

    } catch (error) {
      message.destroy();
      console.error('Error listing invoice:', error);
      message.error(error.message || 'Failed to list invoice');
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return { text: 'Active', color: 'blue' };
      case 1: return { text: 'Released', color: 'green' };
      case 2: return { text: 'Refunded', color: 'orange' };
      case 3: return { text: 'Listed for Sale', color: 'purple' };
      default: return { text: 'Unknown', color: 'default' };
    }
  };

  if (!isConnected) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <Card>
          <FileTextOutlined style={{ fontSize: 64, color: '#1890ff', marginBottom: 20 }} />
          <Title level={3}>Connect Wallet to View Your Invoices</Title>
          <Paragraph type="secondary">
            Connect your wallet to see and manage your Invoice NFTs.
          </Paragraph>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <Title level={2}>My Invoice NFTs</Title>
      <Paragraph>
        Manage your tokenized invoices. List them for sale on the marketplace to get early payment with a discount.
      </Paragraph>

      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Total Invoices"
              value={invoices.length}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic
              title="Listed for Sale"
              value={invoices.filter(i => i.status === 3).length}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {loading ? (
        <Card loading={loading} />
      ) : invoices.length === 0 ? (
        <Empty
          description="No invoices found"
          style={{ padding: '60px 0' }}
        >
          <Paragraph type="secondary">
            Invoice NFTs are automatically minted when you create an escrow as the seller.
          </Paragraph>
        </Empty>
      ) : (
        <Row gutter={[16, 16]}>
          {invoices.map((invoice) => {
            const statusInfo = getStatusText(invoice.status);
            const isListed = invoice.status === 3;

            return (
              <Col xs={24} sm={12} lg={8} key={invoice.tokenId}>
                <Card
                  title={`Invoice NFT #${invoice.tokenId}`}
                  extra={<Tag color={statusInfo.color}>{statusInfo.text}</Tag>}
                  actions={[
                    <Button
                      key="list"
                      type={isListed ? 'default' : 'primary'}
                      icon={<ShoppingCartOutlined />}
                      onClick={() => handleListClick(invoice)}
                      disabled={invoice.status !== 0 && invoice.status !== 3}
                    >
                      {isListed ? 'Update Listing' : 'List for Sale'}
                    </Button>
                  ]}
                >
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <div>
                      <Text strong>Invoice Amount:</Text>
                      <div style={{ fontSize: '20px', color: '#1890ff' }}>
                        {formatUnits(invoice.amount, STABLECOIN_DECIMALS)} {STABLECOIN_SYMBOL}
                      </div>
                    </div>

                    {isListed && (
                      <div>
                        <Text strong>Listed Price:</Text>
                        <div style={{ fontSize: '18px', color: '#52c41a' }}>
                          {formatUnits(invoice.listedPrice, STABLECOIN_DECIMALS)} {STABLECOIN_SYMBOL}
                        </div>
                      </div>
                    )}

                    <div>
                      <Text type="secondary">Escrow ID: #{invoice.escrowId}</Text>
                    </div>

                    <div>
                      <Text type="secondary">Due: {formatDate(invoice.dueDate)}</Text>
                    </div>
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* List Invoice Modal */}
      <Modal
        title="List Invoice for Sale"
        open={listModalVisible}
        onOk={handleListInvoice}
        onCancel={() => setListModalVisible(false)}
        okText="List Invoice"
      >
        {selectedInvoice && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <Text>Invoice NFT #{selectedInvoice.tokenId}</Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text>Invoice Amount: </Text>
              <Text strong>{formatUnits(selectedInvoice.amount, STABLECOIN_DECIMALS)} {STABLECOIN_SYMBOL}</Text>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text>Discount: </Text>
              <InputNumber
                min={1}
                max={50}
                value={discountPercent}
                onChange={handleDiscountChange}
                formatter={value => `${value}%`}
                parser={value => value.replace('%', '')}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <Text>Listed Price: </Text>
              <Text strong style={{ color: '#52c41a', fontSize: '18px' }}>
                {listPrice?.toFixed(2)} {STABLECOIN_SYMBOL}
              </Text>
            </div>

            <Paragraph type="secondary" style={{ marginTop: '16px' }}>
              By listing this invoice, buyers can purchase it at a discount for early payment.
              You'll receive the listed price immediately.
            </Paragraph>
          </div>
        )}
      </Modal>
    </div>
  );
}
