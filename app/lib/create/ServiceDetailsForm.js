'use client';

import React from 'react';
import { 
    Form, 
    Input, 
    Select, 
    Typography,
    Button,
    Space
} from 'antd';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export const SERVICE_CATEGORIES = [
    'Web Development',
    'Mobile Development',
    'Design & Graphics',
    'Writing & Content',
    'Marketing & SEO',
    'Consulting',
    'Photography',
    'Video Production',
    'Legal Services',
    'Accounting & Finance',
    'Other'
];

const DEMO_DATA = {
    // Service Details
    title: "Custom E-commerce Website Development",
    category: "Web Development",
    description: "I will create a fully responsive, modern e-commerce website using React and Node.js. The website will include user authentication, payment processing, product catalog, shopping cart, and admin dashboard. All code will be clean, well-documented, and optimized for performance.",
    deliverables: "- Fully responsive e-commerce website\n- User registration and authentication system\n- Payment gateway integration (Stripe/PayPal)\n- Product catalog with search and filtering\n- Shopping cart and checkout process\n- Admin dashboard for product management\n- SEO optimization\n- 2 rounds of revisions\n- 30 days of post-launch support",
    timeline: "3-4 weeks",
    
    // Payment Terms
    paymentType: 'fixed',
    amount: 2500,
    depositPercentage: 0,
    paymentTerms: 'Full payment ($2,500) due upon completion and client approval. No deposit required - payment released only after successful delivery of all deliverables. Payment accepted in PYUSD stablecoin for transparent, secure transactions.',
    requiresApproval: 'yes'
};

export default function ServiceDetailsForm() {
    const form = Form.useFormInstance();

    const handleSetDemoData = () => {
        form.setFieldsValue(DEMO_DATA);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                    <Title level={3}>Service Details</Title>
                    <Paragraph type="secondary">
                        Describe the service you're offering and set basic requirements.
                    </Paragraph>
                </div>
                <Button 
                    type="dashed" 
                    onClick={handleSetDemoData}
                    style={{ height: 'auto', padding: '8px 16px' }}
                >
                    Fill Demo Data
                </Button>
            </div>
            
            <Form.Item
                name="title"
                label="Service Title"
                rules={[{ required: true, message: 'Please enter a service title' }]}
            >
                <Input 
                    placeholder="e.g., Custom Website Development"
                    size="large"
                />
            </Form.Item>

            <Form.Item
                name="category"
                label="Service Category"
                rules={[{ required: true, message: 'Please select a category' }]}
            >
                <Select placeholder="Select category" size="large">
                    {SERVICE_CATEGORIES.map(category => (
                        <Option key={category} value={category}>{category}</Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="description"
                label="Service Description"
                rules={[{ required: true, message: 'Please provide a description' }]}
            >
                <TextArea 
                    rows={4}
                    placeholder="Describe what you'll deliver, timeline, requirements, etc."
                />
            </Form.Item>

            <Form.Item
                name="deliverables"
                label="Key Deliverables"
                rules={[{ required: true, message: 'Please list key deliverables' }]}
            >
                <TextArea 
                    rows={3}
                    placeholder="- Website with responsive design&#10;- 3 rounds of revisions&#10;- 30 days of support"
                />
            </Form.Item>

            <Form.Item
                name="timeline"
                label="Estimated Timeline"
            >
                <Input 
                    placeholder="e.g., 2-3 weeks"
                    size="large"
                />
            </Form.Item>
        </div>
    );
}
