'use client';

import React, { useState, useEffect } from 'react';
import { 
    Form, 
    Input, 
    Select, 
    InputNumber,
    Row,
    Col,
    Typography,
    Button
} from 'antd';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const PAYMENT_TYPES = [
    { value: 'fixed', label: 'Fixed Price', disabled: false },
    { value: 'hourly', label: 'Hourly Rate', disabled: true },
    { value: 'milestone', label: 'Milestone-based', disabled: true },
    { value: 'deposit', label: 'Deposit + Final Payment', disabled: false }
];

export default function PaymentTermsForm() {
    const [paymentType, setPaymentType] = useState('');
    const form = Form.useFormInstance();

    const DEMO_DATA = {
        paymentType: 'fixed',
        amount: 2500,
        depositPercentage: 0,
        paymentTerms: 'Full payment ($2,500) due upon completion and client approval. No deposit required - payment released only after successful delivery of all deliverables. Payment accepted in PYUSD stablecoin for transparent, secure transactions.',
        requiresApproval: 'yes'
    };

    // Check if form values are already set (from demo data) and update local state
    React.useEffect(() => {
        const currentValues = form.getFieldsValue();
        if (currentValues.paymentType) {
            setPaymentType(currentValues.paymentType);
        }
    }, [form]);

    const handleSetDemoData = () => {
        form.setFieldsValue(DEMO_DATA);
        setPaymentType('fixed');
    };

    const handlePaymentTypeChange = (value) => {
        setPaymentType(value);
        if (value !== 'deposit') {
            // Clear deposit percentage if not deposit type
            form.setFieldsValue({ depositPercentage: undefined });
        } else {
            // Set default deposit percentage for deposit type
            form.setFieldsValue({ depositPercentage: 50 });
        }
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <Title level={3}>Payment Terms</Title>
                    <Paragraph type="secondary">
                        Set your pricing structure and payment requirements.
                    </Paragraph>
                </div>
                <Button 
                    type="dashed" 
                    onClick={handleSetDemoData}
                    style={{ height: 'auto', padding: '8px 16px' }}
                >
                    Set Demo Data
                </Button>
            </div>

            <Form.Item
                name="paymentType"
                label="Payment Structure"
                rules={[{ required: true, message: 'Please select payment type' }]}
            >
                <Select 
                    placeholder="Select payment structure" 
                    size="large"
                    onChange={handlePaymentTypeChange}
                >
                    {PAYMENT_TYPES.map(type => (
                        <Option 
                            key={type.value} 
                            value={type.value} 
                            disabled={type.disabled}
                            style={type.disabled ? { color: '#bfbfbf', cursor: 'not-allowed' } : {}}
                        >
                            {type.label} {type.disabled && '(Coming Soon)'}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="amount"
                        label="Amount (PYUSD)"
                        rules={[{ required: true, message: 'Please enter amount' }]}
                    >
                        <InputNumber
                            min={1}
                            precision={2}
                            placeholder="100.00"
                            size="large"
                            style={{ width: '100%' }}
                            prefix="$"
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="depositPercentage"
                        label={paymentType === 'deposit' ? "Deposit Required (%)" : "Deposit Required (%) - Optional"}
                        rules={paymentType === 'deposit' ? [{ required: true, message: 'Please enter deposit percentage' }] : []}
                    >
                        <InputNumber
                            min={0}
                            max={100}
                            placeholder={paymentType === 'deposit' ? "50" : "0"}
                            size="large"
                            style={{ width: '100%' }}
                            suffix="%"
                            disabled={paymentType !== 'deposit' && paymentType !== 'fixed'}
                        />
                    </Form.Item>
                </Col>
            </Row>

            {paymentType === 'deposit' && (
                <div style={{ 
                    background: '#f6ffed', 
                    border: '1px solid #b7eb8f', 
                    borderRadius: '6px', 
                    padding: '12px', 
                    marginBottom: '16px' 
                }}>
                    <Paragraph style={{ margin: 0, fontSize: '14px' }}>
                        <strong>Deposit Payment Structure:</strong> Client will pay the deposit percentage upfront to secure the service. 
                        The remaining balance will be paid upon completion and approval of deliverables.
                    </Paragraph>
                </div>
            )}

            <Form.Item
                name="paymentTerms"
                label="Payment Terms & Conditions"
            >
                <TextArea 
                    rows={3}
                    placeholder={
                        paymentType === 'deposit' 
                            ? "Deposit required to start work. Final payment upon completion and client approval. Refund policy for deposit, delivery timeline, etc."
                            : "Payment upon completion, refund policy, delivery timeline, etc."
                    }
                />
            </Form.Item>

            <Form.Item
                name="requiresApproval"
                label="Client Approval Required"
            >
                <Select defaultValue="yes" size="large">
                    <Option value="yes">Yes, require client approval before payment release</Option>
                    <Option value="no">No, automatic payment upon completion</Option>
                </Select>
            </Form.Item>
        </div>
    );
}
