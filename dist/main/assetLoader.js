"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadFurnitureAssets = loadFurnitureAssets;
exports.loadDefaultLayout = loadDefaultLayout;
exports.loadWallTiles = loadWallTiles;
exports.loadFloorTiles = loadFloorTiles;
exports.loadCharacterSprites = loadCharacterSprites;
exports.sendAssetsToRenderer = sendAssetsToRenderer;
exports.sendCharacterSpritesToRenderer = sendCharacterSpritesToRenderer;
exports.sendFloorTilesToRenderer = sendFloorTilesToRenderer;
exports.sendWallTilesToRenderer = sendWallTilesToRenderer;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pngjs_1 = require("pngjs");
const constants_1 = require("./constants");
function pngToSpriteData(pngBuffer, width, height) {
    try {
        const png = pngjs_1.PNG.sync.read(pngBuffer);
        const sprite = [];
        const data = png.data;
        for (let y = 0; y < height; y++) {
            const row = [];
            for (let x = 0; x < width; x++) {
                const pixelIndex = (y * png.width + x) * 4;
                const r = data[pixelIndex];
                const g = data[pixelIndex + 1];
                const b = data[pixelIndex + 2];
                const a = data[pixelIndex + 3];
                if (a < constants_1.PNG_ALPHA_THRESHOLD) {
                    row.push('');
                }
                else {
                    row.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase());
                }
            }
            sprite.push(row);
        }
        return sprite;
    }
    catch (err) {
        console.warn(`Failed to parse PNG: ${err instanceof Error ? err.message : err}`);
        const sprite = [];
        for (let y = 0; y < height; y++) {
            sprite.push(new Array(width).fill(''));
        }
        return sprite;
    }
}
async function loadFurnitureAssets(assetsRoot) {
    try {
        const catalogPath = path.join(assetsRoot, 'furniture', 'furniture-catalog.json');
        if (!fs.existsSync(catalogPath)) {
            console.log('[AssetLoader] No furniture catalog found at:', catalogPath);
            return null;
        }
        const catalogContent = fs.readFileSync(catalogPath, 'utf-8');
        const catalogData = JSON.parse(catalogContent);
        const catalog = catalogData.assets || [];
        const sprites = new Map();
        for (const asset of catalog) {
            try {
                let filePath = asset.file;
                if (filePath.startsWith('assets/')) {
                    filePath = filePath.slice('assets/'.length);
                }
                const assetPath = path.join(assetsRoot, filePath);
                if (!fs.existsSync(assetPath))
                    continue;
                const pngBuffer = fs.readFileSync(assetPath);
                sprites.set(asset.id, pngToSpriteData(pngBuffer, asset.width, asset.height));
            }
            catch { /* skip individual asset errors */ }
        }
        console.log(`[AssetLoader] Loaded ${sprites.size}/${catalog.length} furniture assets`);
        return { catalog, sprites };
    }
    catch (err) {
        console.error(`[AssetLoader] Error loading furniture assets: ${err instanceof Error ? err.message : err}`);
        return null;
    }
}
function loadDefaultLayout(assetsRoot) {
    try {
        const layoutPath = path.join(assetsRoot, 'default-layout.json');
        if (!fs.existsSync(layoutPath))
            return null;
        return JSON.parse(fs.readFileSync(layoutPath, 'utf-8'));
    }
    catch {
        return null;
    }
}
async function loadWallTiles(assetsRoot) {
    try {
        const wallPath = path.join(assetsRoot, 'walls.png');
        if (!fs.existsSync(wallPath))
            return null;
        const png = pngjs_1.PNG.sync.read(fs.readFileSync(wallPath));
        const sprites = [];
        for (let mask = 0; mask < constants_1.WALL_BITMASK_COUNT; mask++) {
            const ox = (mask % constants_1.WALL_GRID_COLS) * constants_1.WALL_PIECE_WIDTH;
            const oy = Math.floor(mask / constants_1.WALL_GRID_COLS) * constants_1.WALL_PIECE_HEIGHT;
            const sprite = [];
            for (let r = 0; r < constants_1.WALL_PIECE_HEIGHT; r++) {
                const row = [];
                for (let c = 0; c < constants_1.WALL_PIECE_WIDTH; c++) {
                    const idx = ((oy + r) * png.width + (ox + c)) * 4;
                    const rv = png.data[idx];
                    const gv = png.data[idx + 1];
                    const bv = png.data[idx + 2];
                    const av = png.data[idx + 3];
                    if (av < constants_1.PNG_ALPHA_THRESHOLD) {
                        row.push('');
                    }
                    else {
                        row.push(`#${rv.toString(16).padStart(2, '0')}${gv.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`.toUpperCase());
                    }
                }
                sprite.push(row);
            }
            sprites.push(sprite);
        }
        return { sprites };
    }
    catch {
        return null;
    }
}
async function loadFloorTiles(assetsRoot) {
    try {
        const floorPath = path.join(assetsRoot, 'floors.png');
        if (!fs.existsSync(floorPath))
            return null;
        const png = pngjs_1.PNG.sync.read(fs.readFileSync(floorPath));
        const sprites = [];
        for (let t = 0; t < constants_1.FLOOR_PATTERN_COUNT; t++) {
            const sprite = [];
            for (let y = 0; y < constants_1.FLOOR_TILE_SIZE; y++) {
                const row = [];
                for (let x = 0; x < constants_1.FLOOR_TILE_SIZE; x++) {
                    const px = t * constants_1.FLOOR_TILE_SIZE + x;
                    const idx = (y * png.width + px) * 4;
                    const r = png.data[idx];
                    const g = png.data[idx + 1];
                    const b = png.data[idx + 2];
                    const a = png.data[idx + 3];
                    if (a < constants_1.PNG_ALPHA_THRESHOLD) {
                        row.push('');
                    }
                    else {
                        row.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase());
                    }
                }
                sprite.push(row);
            }
            sprites.push(sprite);
        }
        return { sprites };
    }
    catch {
        return null;
    }
}
async function loadCharacterSprites(assetsRoot) {
    try {
        const charDir = path.join(assetsRoot, 'characters');
        const characters = [];
        for (let ci = 0; ci < constants_1.CHAR_COUNT; ci++) {
            const filePath = path.join(charDir, `char_${ci}.png`);
            if (!fs.existsSync(filePath))
                return null;
            const png = pngjs_1.PNG.sync.read(fs.readFileSync(filePath));
            const charData = { down: [], up: [], right: [] };
            for (let dirIdx = 0; dirIdx < constants_1.CHARACTER_DIRECTIONS.length; dirIdx++) {
                const dir = constants_1.CHARACTER_DIRECTIONS[dirIdx];
                const rowOffsetY = dirIdx * constants_1.CHAR_FRAME_H;
                const frames = [];
                for (let f = 0; f < constants_1.CHAR_FRAMES_PER_ROW; f++) {
                    const sprite = [];
                    const frameOffsetX = f * constants_1.CHAR_FRAME_W;
                    for (let y = 0; y < constants_1.CHAR_FRAME_H; y++) {
                        const row = [];
                        for (let x = 0; x < constants_1.CHAR_FRAME_W; x++) {
                            const idx = (((rowOffsetY + y) * png.width) + (frameOffsetX + x)) * 4;
                            const r = png.data[idx];
                            const g = png.data[idx + 1];
                            const b = png.data[idx + 2];
                            const a = png.data[idx + 3];
                            if (a < constants_1.PNG_ALPHA_THRESHOLD) {
                                row.push('');
                            }
                            else {
                                row.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase());
                            }
                        }
                        sprite.push(row);
                    }
                    frames.push(sprite);
                }
                charData[dir] = frames;
            }
            characters.push(charData);
        }
        return { characters };
    }
    catch {
        return null;
    }
}
function sendAssetsToRenderer(sender, assets) {
    const spritesObj = {};
    for (const [id, spriteData] of assets.sprites) {
        spritesObj[id] = spriteData;
    }
    sender.postMessage({
        type: 'furnitureAssetsLoaded',
        catalog: assets.catalog,
        sprites: spritesObj,
    });
}
function sendCharacterSpritesToRenderer(sender, charSprites) {
    sender.postMessage({ type: 'characterSpritesLoaded', characters: charSprites.characters });
}
function sendFloorTilesToRenderer(sender, floorTiles) {
    sender.postMessage({ type: 'floorTilesLoaded', sprites: floorTiles.sprites });
}
function sendWallTilesToRenderer(sender, wallTiles) {
    sender.postMessage({ type: 'wallTilesLoaded', sprites: wallTiles.sprites });
}
//# sourceMappingURL=assetLoader.js.map