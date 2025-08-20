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

// Badge definitions — mapped to correct image files
const badges = [
    { type: 'milestone', milestone: 1, name: 'First Gift', description: 'Awarded for sending your first gift on GiftZap!', imageFile: '1.png' },
    { type: 'milestone', milestone: 5, name: 'Five Gifts', description: 'Awarded for sending 5 gifts on GiftZap!', imageFile: '2.png' },
    { type: 'milestone', milestone: 10, name: 'Ten Gifts', description: 'Awarded for sending 10 gifts on GiftZap!', imageFile: '3.png' },
    { type: 'charity', name: 'Charity Star', description: 'Awarded for donating to charity on GiftZap!', imageFile: '4.png' }
];

async function uploadImage(filePath) {
    const stream = fs.createReadStream(filePath);
    const result = await pinata.pinFileToIPFS(stream);
    return result.IpfsHash;
}

function createMetadata(badge, imageHash) {
    const metadata = {
        name: badge.name,
        description: badge.description,
        image: `ipfs://${imageHash}`,
        attributes: []
    };

    if (badge.type === 'milestone') {
        metadata.attributes.push({ trait_type: 'Milestone', value: badge.milestone.toString() });
    } else if (badge.type === 'charity') {
        metadata.attributes.push({ trait_type: 'Type', value: 'Charity' });
    }

    return metadata;
}

async function main() {
    try {
        console.log('🚀 Starting IPFS upload process...\n');
        
        // Test authentication
        const authTest = await pinata.testAuthentication();
        console.log('✅ Pinata authentication successful:', authTest.message);
        
        // Create metadata directories
        const metadataDir = path.join(__dirname, 'metadata');
        const badgeDir = path.join(metadataDir, 'QmBadge');
        const charityDir = path.join(metadataDir, 'QmCharity');
        
        if (!fs.existsSync(metadataDir)) fs.mkdirSync(metadataDir);
        if (!fs.existsSync(badgeDir)) fs.mkdirSync(badgeDir);
        if (!fs.existsSync(charityDir)) fs.mkdirSync(charityDir);

        console.log('\n📁 Created metadata directory structure');
        console.log('📤 Uploading images to IPFS...\n');
        
        for (const badge of badges) {
            const imgPath = path.join(__dirname, 'images', badge.imageFile);
            
            // Check if image file exists
            if (!fs.existsSync(imgPath)) {
                console.error(`❌ Image file not found: ${imgPath}`);
                continue;
            }
            
            const imgHash = await uploadImage(imgPath);
            const metadata = createMetadata(badge, imgHash);

            // Save metadata JSON to appropriate folder
            let fileName, filePath;
            if (badge.type === 'milestone') {
                fileName = `${badge.milestone}.json`;
                filePath = path.join(badgeDir, fileName);
            } else {
                fileName = 'charity.json';
                filePath = path.join(charityDir, fileName);
            }

            fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2));
            console.log(`✔ ${badge.name} → ipfs://${imgHash} → ${fileName}`);
        }

        console.log('\n📦 Uploading metadata folder to IPFS...');
        const metaResult = await pinata.pinFromFS(metadataDir, {
            pinataMetadata: {
                name: 'GiftZap-NFT-Metadata'
            }
        });
        
        const baseHash = metaResult.IpfsHash;
        console.log(`\n🎉 Upload complete!`);
        console.log(`\n📋 Smart Contract Configuration:`);
        console.log(`Base URI for milestone badges: ipfs://${baseHash}/QmBadge/`);
        console.log(`Base URI for charity badges: ipfs://${baseHash}/QmCharity/`);
        console.log(`\n🔗 Gateway URLs:`);
        console.log(`Milestone 1: https://gateway.pinata.cloud/ipfs/${baseHash}/QmBadge/1.json`);
        console.log(`Milestone 5: https://gateway.pinata.cloud/ipfs/${baseHash}/QmBadge/5.json`);
        console.log(`Milestone 10: https://gateway.pinata.cloud/ipfs/${baseHash}/QmBadge/10.json`);
        console.log(`Charity: https://gateway.pinata.cloud/ipfs/${baseHash}/QmCharity/charity.json`);
        
        // Save configuration for deployment script
        const config = {
            metadataHash: baseHash,
            milestoneBaseURI: `ipfs://${baseHash}/QmBadge/`,
            charityBaseURI: `ipfs://${baseHash}/QmCharity/`,
            timestamp: new Date().toISOString()
        };
        
        fs.writeFileSync(path.join(__dirname, 'ipfs-config.json'), JSON.stringify(config, null, 2));
        console.log(`\n💾 Configuration saved to ipfs-config.json`);
        
    } catch (error) {
        console.error('❌ Upload failed:', error);
        process.exit(1);
    }
}

main().catch(console.error);
