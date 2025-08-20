const PinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

// ===== CONFIG =====
const pinata = new PinataSDK({
    pinataApiKey: process.env.PINATA_API_KEY,
    pinataSecretApiKey: process.env.PINATA_SECRET_API_KEY
});

async function uploadCharityMetadata(charityData) {
    try {
        const result = await pinata.pinJSONToIPFS(charityData, {
            pinataMetadata: {
                name: `charity-${charityData.name.toLowerCase().replace(/\s+/g, '-')}`
            }
        });
        return result.IpfsHash;
    } catch (error) {
        console.error('Failed to upload charity metadata:', error);
        throw error;
    }
}

async function main() {
    const charitiesFile = process.argv[2];
    if (!charitiesFile) {
        console.log('Usage: node upload-charities.js <charities.json>');
        console.log('\nExample charities.json format:');
        console.log(JSON.stringify([
            {
                "name": "Mantle Aid",
                "description": "Supports blockchain education and development",
                "logo": "mantle-aid.jpg",
                "website": "https://mantleaid.org",
                "walletAddress": "0xbE3171d0e36a012319a5C76bCcD71250499b1C16"
            },
            {
                "name": "Crypto Charity",
                "description": "Funds open-source blockchain projects",
                "logo": "crypto-charity.jpg", 
                "website": "https://cryptocharity.org",
                "walletAddress": "0x801ce3C86a4075F094C973D8Dd5e2bD5cde6a873"
            }
        ], null, 2));
        process.exit(1);
    }

    try {
        console.log('🚀 Starting charity metadata upload process...\n');
        
        // Test authentication
        const authTest = await pinata.testAuthentication();
        console.log('✅ Pinata authentication successful:', authTest.message);
        
        // Read charities data
        const charitiesData = JSON.parse(fs.readFileSync(charitiesFile, 'utf8'));
        
        if (!Array.isArray(charitiesData)) {
            throw new Error('Charities file must contain an array of charity objects');
        }

        console.log(`\n📤 Uploading ${charitiesData.length} charities to IPFS...\n`);
        
        const results = [];
        
        for (const charity of charitiesData) {
            // Validate required fields
            if (!charity.name || !charity.description || !charity.walletAddress) {
                console.error(`❌ Missing required fields for charity: ${JSON.stringify(charity)}`);
                continue;
            }
            
            console.log(`📝 Uploading: ${charity.name}...`);
            const ipfsHash = await uploadCharityMetadata(charity);
            
            const result = {
                ...charity,
                ipfsHash,
                ipfsUrl: `ipfs://${ipfsHash}`,
                gatewayUrl: `https://gateway.pinata.cloud/ipfs/${ipfsHash}`
            };
            
            results.push(result);
            console.log(`✅ ${charity.name} → ${ipfsHash}`);
        }

        console.log('\n🎉 Upload complete!\n');
        console.log('📋 Results for smart contract deployment:\n');
        
        results.forEach((result, index) => {
            console.log(`Charity ${index + 1}:`);
            console.log(`  Name: ${result.name}`);
            console.log(`  Address: ${result.walletAddress}`);
            console.log(`  IPFS Hash: ${result.ipfsHash}`);
            console.log(`  Gateway URL: ${result.gatewayUrl}\n`);
        });
        
        // Save results for deployment script
        const config = {
            charities: results,
            timestamp: new Date().toISOString()
        };
        
        const outputFile = path.join(__dirname, 'charity-config.json');
        fs.writeFileSync(outputFile, JSON.stringify(config, null, 2));
        console.log(`💾 Configuration saved to ${outputFile}`);
        
        // Generate deployment script snippet
        console.log('\n📜 Smart Contract Deployment Code:');
        console.log('// Add this to your deployment script:\n');
        results.forEach((result, index) => {
            console.log(`giftManager.addCharity("${result.walletAddress}", "${result.name}", "${result.ipfsHash}");`);
        });
        
    } catch (error) {
        console.error('❌ Upload failed:', error);
        process.exit(1);
    }
}

main().catch(console.error);