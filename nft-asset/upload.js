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

// Badge definitions — add/remove as needed
const badges = [
    { type: 'milestone', milestone: 1, name: 'Gift Milestone 1', description: 'Awarded for sending your first gift on GiftZap!', imageFile: 'milestone1.png' },
    { type: 'milestone', milestone: 5, name: 'Gift Milestone 5', description: 'Awarded for sending 5 gifts on GiftZap!', imageFile: 'milestone5.png' },
    { type: 'milestone', milestone: 10, name: 'Gift Milestone 10', description: 'Awarded for sending 10 gifts on GiftZap!', imageFile: 'milestone10.png' },
    { type: 'charity', name: 'Charity Star', description: 'Awarded for donating to charity on GiftZap!', imageFile: 'charity.png' }
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
    const metadataDir = path.join(__dirname, 'metadata');
    if (!fs.existsSync(metadataDir)) fs.mkdirSync(metadataDir);

    console.log('Uploading images to IPFS...');
    for (const badge of badges) {
        const imgPath = path.join(__dirname, 'images', badge.imageFile);
        const imgHash = await uploadImage(imgPath);
        const metadata = createMetadata(badge, imgHash);

        // Save metadata JSON locally
        let fileName;
        if (badge.type === 'milestone') fileName = `${badge.milestone}.json`;
        else fileName = `charity${badges.indexOf(badge) + 1}.json`;

        fs.writeFileSync(path.join(metadataDir, fileName), JSON.stringify(metadata, null, 2));
        console.log(`✔ ${badge.name} image uploaded → ipfs://${imgHash}`);
    }

    console.log('Uploading metadata folder to IPFS...');
    const metaResult = await pinata.pinFromFS(metadataDir);
    console.log(`\n✅ Metadata folder uploaded → ipfs://${metaResult.IpfsHash}`);
    console.log(`Base URI for milestones: ipfs://${metaResult.IpfsHash}/`);
    console.log(`Charity URI (same folder if mixed): ipfs://${metaResult.IpfsHash}/charity1.json`);
}

main().catch(console.error);
