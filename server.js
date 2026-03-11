import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const JWT_SECRET = process.env.JWT_SECRET || 'super-senha-secreta';

app.use(cors());
app.use(express.json());

let db, usersCollection, productsCollection, customersCollection, salesCollection, analyticsCollection, campaignsCollection;

async function connectDB() {
  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('gestao_loja');
    usersCollection = db.collection('users');
    productsCollection = db.collection('products');
    customersCollection = db.collection('customers');
    salesCollection = db.collection('sales');
    analyticsCollection = db.collection('analytics');
    campaignsCollection = db.collection('campaigns');
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

const authenticateToken = (req, res, next) => {
  if (req.method === 'GET') return next();

  if (req.method === 'POST') {
    const operationName = req.body?.operationName;
    const query = req.body?.query || '';
    if (operationName === 'IntrospectionQuery' || query.includes('__schema')) {
      return next();
    }
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.user = user;
    next();
  });
};

// Auth Routes
app.post("/api/signup", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    const newUser = { id: userId, email, password: hashedPassword, name, role: role || "vendedor", createdAt: new Date().toISOString() };
    await usersCollection.insertOne(newUser);
    res.json({ success: true, user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role } });
  } catch (error) { res.status(500).json({ error: "Error creating user" }); }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await usersCollection.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ success: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  } catch (error) { res.status(500).json({ error: "Login error" }); }
});

// GraphQL Schema
const typeDefs = `#graphql
  type Product { id: ID!, name: String!, category: String, price: Float!, stock: Int! }
  type Customer { id: ID!, name: String!, email: String, phone: String, tier: String, totalSpent: Float }
  type SaleItem { productId: String!, productName: String!, quantity: Int!, price: Float!, total: Float! }
  type Sale { id: ID!, customerId: String!, customerName: String, items: [SaleItem]!, total: Float!, createdAt: String! }
  type DailyAnalytics { id: ID!, date: String!, visitors: Int!, pageViews: Int!, conversionRate: Float! }
  type Campaign { id: ID!, name: String!, platform: String!, status: String!, budget: Float!, spent: Float!, impressions: Int!, clicks: Int!, conversions: Int!, roi: Float! }
  
  type TopProduct { name: String!, revenue: Float!, count: Int! }
  type LowStockItem { id: ID!, name: String!, stock: Int! }
  type ChartData { date: String!, total: Float! }
  type RestockSuggestion { id: ID!, name: String!, currentStock: Int!, avgDaily: Float!, suggestedRestock: Int! }
  
  type DashboardStats {
    totalRevenue: Float!
    revenueGrowth: Float!
    totalSales: Int!
    averageTicket: Float!
    topProducts: [TopProduct]!
    lowStock: [LowStockItem]!
    salesChart: [ChartData]!
    restockSuggestions: [RestockSuggestion]!
  }

  input SaleItemInput { productId: String!, productName: String!, quantity: Int!, price: Float!, total: Float! }
  input ProductInput { name: String, category: String, price: Float, stock: Int }
  input CustomerInput { name: String, email: String, phone: String, tier: String }
  input CampaignInput { name: String!, platform: String!, status: String, budget: Float! }

  type Query {
    products: [Product]
    customers: [Customer]
    sales: [Sale]
    analytics(startDate: String, endDate: String): [DailyAnalytics]
    campaigns: [Campaign]
    dashboardStats(startDate: String, endDate: String): DashboardStats
  }

  type Mutation {
    createProduct(input: ProductInput!): Product
    updateProduct(id: ID!, input: ProductInput): Product
    deleteProduct(id: ID!): Boolean
    addCustomer(input: CustomerInput!): Customer
    updateCustomer(id: ID!, input: CustomerInput): Customer
    deleteCustomer(id: ID!): Boolean
    addSale(customerId: String!, customerName: String, items: [SaleItemInput]!, total: Float!): Sale
    addCampaign(input: CampaignInput!): Campaign
  }
`;

const resolvers = {
  Query: {
    products: async () => (await productsCollection.find().toArray()).map(p => ({ ...p, id: p._id.toString() })),
    customers: async () => (await customersCollection.find().toArray()).map(c => ({ ...c, id: c._id.toString() })),
    sales: async () => (await salesCollection.find().sort({ createdAt: -1 }).toArray()).map(s => ({ ...s, id: s._id.toString(), createdAt: new Date(s.createdAt).toISOString() })),
    analytics: async (_, { startDate, endDate }) => {
      let filter = {};
      if (startDate && endDate) filter = { date: { $gte: startDate.split('T')[0], $lte: endDate.split('T')[0] } };
      return (await analyticsCollection.find(filter).sort({ date: 1 }).toArray()).map(a => ({ ...a, id: a._id.toString() }));
    },
    campaigns: async () => (await campaignsCollection.find().toArray()).map(c => ({ ...c, id: c._id.toString() })),
    dashboardStats: async (_, { startDate, endDate }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const end = endDate ? new Date(endDate) : new Date();
      const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const sales = await salesCollection.find({ createdAt: { $gte: start, $lte: end } }).toArray();
      const totalRevenue = sales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      const totalSales = sales.length;
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;
      
      const periodDuration = end.getTime() - start.getTime();
      const prevStart = new Date(start.getTime() - periodDuration);
      const prevSales = await salesCollection.find({ createdAt: { $gte: prevStart, $lte: start } }).toArray();
      const prevRevenue = prevSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
      let revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      const productCount = {};
      sales.forEach(sale => {
        (sale.items || []).forEach(item => {
          if (!productCount[item.productName]) productCount[item.productName] = { name: item.productName, revenue: 0, count: 0 };
          productCount[item.productName].revenue += item.total;
          productCount[item.productName].count += item.quantity;
        });
      });
      const topProducts = Object.values(productCount).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      const chartDataMap = {};
      sales.forEach(sale => {
        const dateStr = new Date(sale.createdAt).toISOString().split('T')[0];
        chartDataMap[dateStr] = { date: dateStr, total: (chartDataMap[dateStr]?.total || 0) + sale.total };
      });
      const salesChart = Object.values(chartDataMap).sort((a, b) => a.date.localeCompare(b.date));

      const products = await productsCollection.find().toArray();
      const lowStock = products.filter(p => p.stock < 10).map(p => ({ id: p._id.toString(), name: p.name, stock: p.stock }));
      
      return { totalRevenue, revenueGrowth, totalSales, averageTicket, topProducts, lowStock, salesChart, restockSuggestions: [] };
    }
  },
  Mutation: {
    createProduct: async (_, { input }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const newProduct = { ...input };
      const result = await productsCollection.insertOne(newProduct);
      return { ...newProduct, id: result.insertedId.toString() };
    },
    updateProduct: async (_, { id, input }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      await productsCollection.updateOne({ _id: new ObjectId(id) }, { $set: input });
      const updated = await productsCollection.findOne({ _id: new ObjectId(id) });
      return { ...updated, id: updated._id.toString() };
    },
    deleteProduct: async (_, { id }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const result = await productsCollection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    },
    addCustomer: async (_, { input }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const newCustomer = { ...input, tier: "bronze", totalSpent: 0, createdAt: new Date() };
      const result = await customersCollection.insertOne(newCustomer);
      return { ...newCustomer, id: result.insertedId.toString() };
    },
    updateCustomer: async (_, { id, input }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      await customersCollection.updateOne({ _id: new ObjectId(id) }, { $set: input });
      const updated = await customersCollection.findOne({ _id: new ObjectId(id) });
      return { ...updated, id: updated._id.toString() };
    },
    deleteCustomer: async (_, { id }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const result = await customersCollection.deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    },
    addSale: async (_, { customerId, customerName, items, total }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const newSale = { customerId, customerName, items, total, createdAt: new Date() };
      const result = await salesCollection.insertOne(newSale);
      
      const customer = await customersCollection.findOne({ _id: new ObjectId(customerId) });
      if (customer) {
        const novoTotalGasto = (customer.totalSpent || 0) + total;
        let novoTier = "bronze";
        if (novoTotalGasto >= 15000) novoTier = "ouro";
        else if (novoTotalGasto >= 7000) novoTier = "prata";
        await customersCollection.updateOne(
          { _id: new ObjectId(customerId) },
          { $set: { totalSpent: novoTotalGasto, tier: novoTier } }
        );
      }
      for (let item of items) {
        if (item.productId) {
          await productsCollection.updateOne(
            { _id: new ObjectId(item.productId) },
            { $inc: { stock: -item.quantity } }
          );
        }
      }
      return { id: result.insertedId.toString(), ...newSale, createdAt: newSale.createdAt.toISOString() };
    },
    addCampaign: async (_, { input }, context) => {
      if (!context.user) throw new Error("Unauthorized");
      const newCampaign = { ...input, spent: 0, impressions: 0, clicks: 0, conversions: 0, roi: 0, createdAt: new Date() };
      const result = await campaignsCollection.insertOne(newCampaign);
      return { ...newCampaign, id: result.insertedId.toString() };
    }
  }
};

async function startServer() {
  await connectDB();
  const apolloServer = new ApolloServer({ typeDefs, resolvers });
  await apolloServer.start();

  const ensureBody = (req, res, next) => {
    if (!req.body) req.body = {};
    next();
  };

  app.use(
    '/graphql',
    cors(),
    express.json(),
    ensureBody,
    authenticateToken,
    expressMiddleware(apolloServer, { 
      context: async ({ req }) => ({ user: req.user }) 
    })
  );

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();