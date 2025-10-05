import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const url = process.env.SUPABASE_URL!;
const anon = process.env.SUPABASE_ANON_KEY!;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const appUrl = process.env.APP_PUBLIC_URL || 'http://localhost:3000';

const sbPublic = createClient(url, anon);
const sbService = service ? createClient(url, service) : sbPublic;

const mcpServer = new McpServer({
  name: 'magicmenu-mcp',
  version: '0.1.0',
});

// Tool to fetch restaurant by slug
mcpServer.registerTool('getRestaurantBySlug', {
  description: 'Fetch public restaurant row by slug',
  inputSchema: {
    slug: z.string().describe('Restaurant slug identifier'),
  },
}, async ({ slug }) => {
    const { data, error } = await sbPublic.from('restaurants').select('*').eq('slug', slug).single();
    if (error) throw new Error(error.message);
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
});

// Tool to generate QR code for restaurant
mcpServer.registerTool('generateRestaurantQr', {
  description: 'Create a QR PNG for a restaurant and store it; returns public URL',
  inputSchema: {
    restaurant_id: z.string().describe('Restaurant ID'),
    slug: z.string().describe('Restaurant slug'),
  },
}, async ({ restaurant_id, slug }) => {
    const link = `${appUrl}/r/${slug}?src=qr`;
    const png = await QRCode.toBuffer(link, { margin: 1, width: 512 });
    const path = `qr-codes/${restaurant_id}/qr.png`;
    const { error: upErr } = await sbService.storage.from('QR-code').upload(path, png, { upsert: true, contentType: 'image/png' });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = sbService.storage.from('QR-code').getPublicUrl(path);
    await sbService.from('restaurants').update({ qr_url: pub.publicUrl }).eq('id', restaurant_id);
  return { content: [{ type: 'text', text: JSON.stringify({ qr_url: pub.publicUrl, link }, null, 2) }] };
});

// Tool to check if tables exist
mcpServer.registerTool('checkDatabase', {
  description: 'Check if the MagicMenu database tables exist',
  inputSchema: {},
}, async () => {
  try {
    // Try to query each table to see if it exists
    const checks = [];
    
    const { error: restaurantError } = await sbService.from('restaurants').select('id').limit(1);
    checks.push(`Restaurants table: ${restaurantError ? 'Missing' : 'Exists'}`);
    
    const { error: categoryError } = await sbService.from('categories').select('id').limit(1);
    checks.push(`Categories table: ${categoryError ? 'Missing' : 'Exists'}`);
    
    const { error: menuError } = await sbService.from('menu_items').select('id').limit(1);
    checks.push(`Menu items table: ${menuError ? 'Missing' : 'Exists'}`);
    
    return { content: [{ type: 'text', text: checks.join('\n') + '\n\nIf tables are missing, please run the schema.sql file in Supabase SQL Editor first.' }] };
  } catch (error) {
    return { content: [{ type: 'text', text: `Database check failed: ${error.message}` }] };
  }
});

// Tool to add sample data
mcpServer.registerTool('addSampleData', {
  description: 'Add sample restaurant data for testing',
  inputSchema: {},
}, async () => {
  // Insert sample restaurants with NULL owner_user_id to avoid foreign key issues
  const { error: restaurantError } = await sbService.from('restaurants').insert([
    {
      id: '11111111-1111-1111-1111-111111111111',
      slug: 'bella-italia',
      name: 'Bella Italia',
      description: 'Authentic Italian cuisine with fresh ingredients and traditional recipes',
      phone: '+1-555-0123',
      address: '123 Main Street, Downtown',
      owner_user_id: null,
      avg_rating: 4.5,
      review_count: 2
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      slug: 'tokyo-sushi',
      name: 'Tokyo Sushi Bar',
      description: 'Fresh sushi and Japanese dishes made by master chefs',
      phone: '+1-555-0456',
      address: '456 Oak Avenue, Midtown',
      owner_user_id: null,
      avg_rating: 4.5,
      review_count: 2
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      slug: 'burger-palace',
      name: 'The Burger Palace',
      description: 'Gourmet burgers and American classics in a cozy atmosphere',
      phone: '+1-555-0789',
      address: '789 Pine Road, Uptown',
      owner_user_id: null,
      avg_rating: 4.5,
      review_count: 2
    }
  ]);

  if (restaurantError) throw new Error(`Restaurant insert failed: ${restaurantError.message}`);

  // Insert categories
  const { error: categoryError } = await sbService.from('categories').insert([
    { id: 'aaaa1111-1111-1111-1111-111111111111', restaurant_id: '11111111-1111-1111-1111-111111111111', name: 'Appetizers', sort_order: 1 },
    { id: 'aaaa2222-2222-2222-2222-222222222222', restaurant_id: '11111111-1111-1111-1111-111111111111', name: 'Pasta', sort_order: 2 },
    { id: 'aaaa3333-3333-3333-3333-333333333333', restaurant_id: '11111111-1111-1111-1111-111111111111', name: 'Pizza', sort_order: 3 },
    { id: 'bbbb1111-1111-1111-1111-111111111111', restaurant_id: '22222222-2222-2222-2222-222222222222', name: 'Sushi Rolls', sort_order: 1 },
    { id: 'bbbb2222-2222-2222-2222-222222222222', restaurant_id: '22222222-2222-2222-2222-222222222222', name: 'Sashimi', sort_order: 2 },
    { id: 'bbbb3333-3333-3333-3333-333333333333', restaurant_id: '22222222-2222-2222-2222-222222222222', name: 'Hot Dishes', sort_order: 3 },
    { id: 'cccc1111-1111-1111-1111-111111111111', restaurant_id: '33333333-3333-3333-3333-333333333333', name: 'Burgers', sort_order: 1 },
    { id: 'cccc2222-2222-2222-2222-222222222222', restaurant_id: '33333333-3333-3333-3333-333333333333', name: 'Sides', sort_order: 2 },
    { id: 'cccc3333-3333-3333-3333-333333333333', restaurant_id: '33333333-3333-3333-3333-333333333333', name: 'Beverages', sort_order: 3 }
  ]);

  if (categoryError) throw new Error(`Category insert failed: ${categoryError.message}`);

  // Insert sample menu items
  const menuItems = [
    { id: 'item1111-1111-1111-1111-111111111111', restaurant_id: '11111111-1111-1111-1111-111111111111', category_id: 'aaaa1111-1111-1111-1111-111111111111', name: 'Bruschetta', description: 'Toasted bread with fresh tomatoes, basil, and garlic', price_cents: 1200 },
    { id: 'item1121-1111-1111-1111-111111111111', restaurant_id: '11111111-1111-1111-1111-111111111111', category_id: 'aaaa2222-2222-2222-2222-222222222222', name: 'Spaghetti Carbonara', description: 'Classic pasta with eggs, pancetta, and parmesan', price_cents: 2200 },
    { id: 'item1131-1111-1111-1111-111111111111', restaurant_id: '11111111-1111-1111-1111-111111111111', category_id: 'aaaa3333-3333-3333-3333-333333333333', name: 'Margherita Pizza', description: 'Traditional pizza with tomato, mozzarella, and basil', price_cents: 1800 },
    { id: 'item2111-2222-2222-2222-222222222222', restaurant_id: '22222222-2222-2222-2222-222222222222', category_id: 'bbbb1111-1111-1111-1111-111111111111', name: 'California Roll', description: 'Crab, avocado, and cucumber with sesame seeds', price_cents: 1400 },
    { id: 'item2121-2222-2222-2222-222222222222', restaurant_id: '22222222-2222-2222-2222-222222222222', category_id: 'bbbb2222-2222-2222-2222-222222222222', name: 'Salmon Sashimi', description: 'Fresh Atlantic salmon, 6 pieces', price_cents: 1800 },
    { id: 'item2131-2222-2222-2222-222222222222', restaurant_id: '22222222-2222-2222-2222-222222222222', category_id: 'bbbb3333-3333-3333-3333-333333333333', name: 'Chicken Teriyaki', description: 'Grilled chicken with teriyaki sauce and rice', price_cents: 1900 },
    { id: 'item3111-3333-3333-3333-333333333333', restaurant_id: '33333333-3333-3333-3333-333333333333', category_id: 'cccc1111-1111-1111-1111-111111111111', name: 'Classic Cheeseburger', description: 'Beef patty with cheese, lettuce, tomato, and pickles', price_cents: 1500 },
    { id: 'item3121-3333-3333-3333-333333333333', restaurant_id: '33333333-3333-3333-3333-333333333333', category_id: 'cccc2222-2222-2222-2222-222222222222', name: 'French Fries', description: 'Crispy golden fries with sea salt', price_cents: 800 },
    { id: 'item3131-3333-3333-3333-333333333333', restaurant_id: '33333333-3333-3333-3333-333333333333', category_id: 'cccc3333-3333-3333-3333-333333333333', name: 'Coca Cola', description: 'Classic Coca Cola, ice cold', price_cents: 300 }
  ];

  const { error: menuError } = await sbService.from('menu_items').insert(menuItems);
  if (menuError) throw new Error(`Menu items insert failed: ${menuError.message}`);

  return { content: [{ type: 'text', text: 'Successfully added sample data:\n- 3 restaurants (Bella Italia, Tokyo Sushi, Burger Palace)\n- 9 categories\n- 9 menu items\n\nYou can now search for restaurants in your app!' }] };
});

async function main() {
const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  console.log('MagicMenu MCP server is running...');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
