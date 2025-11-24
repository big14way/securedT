import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { tokenId } = params;
  
  try {
    // In production, you would fetch actual invoice data from blockchain
    // For now, we'll generate metadata based on token ID
    
    const metadata = {
      name: `Invoice #${tokenId}`,
      description: `Tokenized invoice representing a secured payment escrow. This NFT can be traded on secondary markets for invoice factoring and early payment opportunities.`,
      image: generateInvoiceSVG(tokenId),
      external_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://securedtransfer.app'}/marketplace`,
      attributes: [
        {
          trait_type: "Token ID",
          value: tokenId
        },
        {
          trait_type: "Asset Type",
          value: "Invoice"
        },
        {
          trait_type: "Blockchain",
          value: "Mantle Network"
        },
        {
          trait_type: "Standard",
          value: "ERC-721"
        }
      ]
    };
    
    return NextResponse.json(metadata);
  } catch (error) {
    console.error('Error generating metadata:', error);
    return NextResponse.json(
      { error: 'Failed to generate metadata' },
      { status: 500 }
    );
  }
}

function generateInvoiceSVG(tokenId) {
  // Generate a simple SVG image for the invoice NFT
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#1890ff;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#52c41a;stop-opacity:1" />
        </linearGradient>
      </defs>
      
      <!-- Background -->
      <rect width="400" height="400" fill="url(#grad1)"/>
      
      <!-- Invoice Icon -->
      <rect x="80" y="80" width="240" height="280" fill="white" rx="10"/>
      <rect x="100" y="100" width="200" height="30" fill="#f0f2f5" rx="5"/>
      <rect x="100" y="150" width="150" height="15" fill="#d9d9d9" rx="3"/>
      <rect x="100" y="180" width="180" height="15" fill="#d9d9d9" rx="3"/>
      <rect x="100" y="210" width="120" height="15" fill="#d9d9d9" rx="3"/>
      
      <!-- Token ID -->
      <text x="200" y="300" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#1890ff">
        #${tokenId}
      </text>
      
      <!-- Label -->
      <text x="200" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#595959">
        INVOICE NFT
      </text>
    </svg>
  `;
  
  // Convert SVG to base64 data URI
  const base64 = Buffer.from(svg).toString('base64');
  return `data:image/svg+xml;base64,${base64}`;
}
