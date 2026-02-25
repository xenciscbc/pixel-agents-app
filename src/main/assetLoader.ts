import * as fs from 'fs';
import * as path from 'path';
import type { MessageSender } from './types';
import { PNG } from 'pngjs';
import {
	PNG_ALPHA_THRESHOLD,
	WALL_PIECE_WIDTH,
	WALL_PIECE_HEIGHT,
	WALL_GRID_COLS,
	WALL_BITMASK_COUNT,
	FLOOR_PATTERN_COUNT,
	FLOOR_TILE_SIZE,
	CHARACTER_DIRECTIONS,
	CHAR_FRAME_W,
	CHAR_FRAME_H,
	CHAR_FRAMES_PER_ROW,
	CHAR_COUNT,
} from './constants';

export interface FurnitureAsset {
	id: string;
	name: string;
	label: string;
	category: string;
	file: string;
	width: number;
	height: number;
	footprintW: number;
	footprintH: number;
	isDesk: boolean;
	canPlaceOnWalls: boolean;
	partOfGroup?: boolean;
	groupId?: string;
	canPlaceOnSurfaces?: boolean;
	backgroundTiles?: number;
	orientation?: string;
	state?: string;
}

export interface LoadedAssets {
	catalog: FurnitureAsset[];
	sprites: Map<string, string[][]>;
}

export interface CharacterDirectionSprites {
	down: string[][][];
	up: string[][][];
	right: string[][][];
}

export interface LoadedCharacterSprites {
	characters: CharacterDirectionSprites[];
}

export interface LoadedFloorTiles {
	sprites: string[][][];
}

export interface LoadedWallTiles {
	sprites: string[][][];
}

function pngToSpriteData(pngBuffer: Buffer, width: number, height: number): string[][] {
	try {
		const png = PNG.sync.read(pngBuffer);
		const sprite: string[][] = [];
		const data = png.data;

		for (let y = 0; y < height; y++) {
			const row: string[] = [];
			for (let x = 0; x < width; x++) {
				const pixelIndex = (y * png.width + x) * 4;
				const r = data[pixelIndex];
				const g = data[pixelIndex + 1];
				const b = data[pixelIndex + 2];
				const a = data[pixelIndex + 3];
				if (a < PNG_ALPHA_THRESHOLD) {
					row.push('');
				} else {
					row.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase());
				}
			}
			sprite.push(row);
		}
		return sprite;
	} catch (err) {
		console.warn(`Failed to parse PNG: ${err instanceof Error ? err.message : err}`);
		const sprite: string[][] = [];
		for (let y = 0; y < height; y++) {
			sprite.push(new Array(width).fill(''));
		}
		return sprite;
	}
}

export async function loadFurnitureAssets(assetsRoot: string): Promise<LoadedAssets | null> {
	try {
		const catalogPath = path.join(assetsRoot, 'furniture', 'furniture-catalog.json');
		if (!fs.existsSync(catalogPath)) {
			console.log('[AssetLoader] No furniture catalog found at:', catalogPath);
			return null;
		}

		const catalogContent = fs.readFileSync(catalogPath, 'utf-8');
		const catalogData = JSON.parse(catalogContent);
		const catalog: FurnitureAsset[] = catalogData.assets || [];
		const sprites = new Map<string, string[][]>();

		for (const asset of catalog) {
			try {
				let filePath = asset.file;
				if (filePath.startsWith('assets/')) {
					filePath = filePath.slice('assets/'.length);
				}
				const assetPath = path.join(assetsRoot, filePath);
				if (!fs.existsSync(assetPath)) continue;

				const pngBuffer = fs.readFileSync(assetPath);
				sprites.set(asset.id, pngToSpriteData(pngBuffer, asset.width, asset.height));
			} catch { /* skip individual asset errors */ }
		}

		console.log(`[AssetLoader] Loaded ${sprites.size}/${catalog.length} furniture assets`);
		return { catalog, sprites };
	} catch (err) {
		console.error(`[AssetLoader] Error loading furniture assets: ${err instanceof Error ? err.message : err}`);
		return null;
	}
}

export function loadDefaultLayout(assetsRoot: string): Record<string, unknown> | null {
	try {
		const layoutPath = path.join(assetsRoot, 'default-layout.json');
		if (!fs.existsSync(layoutPath)) return null;
		return JSON.parse(fs.readFileSync(layoutPath, 'utf-8')) as Record<string, unknown>;
	} catch {
		return null;
	}
}

export async function loadWallTiles(assetsRoot: string): Promise<LoadedWallTiles | null> {
	try {
		const wallPath = path.join(assetsRoot, 'walls.png');
		if (!fs.existsSync(wallPath)) return null;

		const png = PNG.sync.read(fs.readFileSync(wallPath));
		const sprites: string[][][] = [];
		for (let mask = 0; mask < WALL_BITMASK_COUNT; mask++) {
			const ox = (mask % WALL_GRID_COLS) * WALL_PIECE_WIDTH;
			const oy = Math.floor(mask / WALL_GRID_COLS) * WALL_PIECE_HEIGHT;
			const sprite: string[][] = [];
			for (let r = 0; r < WALL_PIECE_HEIGHT; r++) {
				const row: string[] = [];
				for (let c = 0; c < WALL_PIECE_WIDTH; c++) {
					const idx = ((oy + r) * png.width + (ox + c)) * 4;
					const rv = png.data[idx];
					const gv = png.data[idx + 1];
					const bv = png.data[idx + 2];
					const av = png.data[idx + 3];
					if (av < PNG_ALPHA_THRESHOLD) {
						row.push('');
					} else {
						row.push(`#${rv.toString(16).padStart(2, '0')}${gv.toString(16).padStart(2, '0')}${bv.toString(16).padStart(2, '0')}`.toUpperCase());
					}
				}
				sprite.push(row);
			}
			sprites.push(sprite);
		}
		return { sprites };
	} catch {
		return null;
	}
}

export async function loadFloorTiles(assetsRoot: string): Promise<LoadedFloorTiles | null> {
	try {
		const floorPath = path.join(assetsRoot, 'floors.png');
		if (!fs.existsSync(floorPath)) return null;

		const png = PNG.sync.read(fs.readFileSync(floorPath));
		const sprites: string[][][] = [];
		for (let t = 0; t < FLOOR_PATTERN_COUNT; t++) {
			const sprite: string[][] = [];
			for (let y = 0; y < FLOOR_TILE_SIZE; y++) {
				const row: string[] = [];
				for (let x = 0; x < FLOOR_TILE_SIZE; x++) {
					const px = t * FLOOR_TILE_SIZE + x;
					const idx = (y * png.width + px) * 4;
					const r = png.data[idx];
					const g = png.data[idx + 1];
					const b = png.data[idx + 2];
					const a = png.data[idx + 3];
					if (a < PNG_ALPHA_THRESHOLD) {
						row.push('');
					} else {
						row.push(`#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase());
					}
				}
				sprite.push(row);
			}
			sprites.push(sprite);
		}
		return { sprites };
	} catch {
		return null;
	}
}

export async function loadCharacterSprites(assetsRoot: string): Promise<LoadedCharacterSprites | null> {
	try {
		const charDir = path.join(assetsRoot, 'characters');
		const characters: CharacterDirectionSprites[] = [];

		for (let ci = 0; ci < CHAR_COUNT; ci++) {
			const filePath = path.join(charDir, `char_${ci}.png`);
			if (!fs.existsSync(filePath)) return null;

			const png = PNG.sync.read(fs.readFileSync(filePath));
			const charData: CharacterDirectionSprites = { down: [], up: [], right: [] };

			for (let dirIdx = 0; dirIdx < CHARACTER_DIRECTIONS.length; dirIdx++) {
				const dir = CHARACTER_DIRECTIONS[dirIdx];
				const rowOffsetY = dirIdx * CHAR_FRAME_H;
				const frames: string[][][] = [];

				for (let f = 0; f < CHAR_FRAMES_PER_ROW; f++) {
					const sprite: string[][] = [];
					const frameOffsetX = f * CHAR_FRAME_W;
					for (let y = 0; y < CHAR_FRAME_H; y++) {
						const row: string[] = [];
						for (let x = 0; x < CHAR_FRAME_W; x++) {
							const idx = (((rowOffsetY + y) * png.width) + (frameOffsetX + x)) * 4;
							const r = png.data[idx];
							const g = png.data[idx + 1];
							const b = png.data[idx + 2];
							const a = png.data[idx + 3];
							if (a < PNG_ALPHA_THRESHOLD) {
								row.push('');
							} else {
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
	} catch {
		return null;
	}
}

export function sendAssetsToRenderer(sender: MessageSender, assets: LoadedAssets): void {
	const spritesObj: Record<string, string[][]> = {};
	for (const [id, spriteData] of assets.sprites) {
		spritesObj[id] = spriteData;
	}
	sender.postMessage({
		type: 'furnitureAssetsLoaded',
		catalog: assets.catalog,
		sprites: spritesObj,
	});
}

export function sendCharacterSpritesToRenderer(sender: MessageSender, charSprites: LoadedCharacterSprites): void {
	sender.postMessage({ type: 'characterSpritesLoaded', characters: charSprites.characters });
}

export function sendFloorTilesToRenderer(sender: MessageSender, floorTiles: LoadedFloorTiles): void {
	sender.postMessage({ type: 'floorTilesLoaded', sprites: floorTiles.sprites });
}

export function sendWallTilesToRenderer(sender: MessageSender, wallTiles: LoadedWallTiles): void {
	sender.postMessage({ type: 'wallTilesLoaded', sprites: wallTiles.sprites });
}
