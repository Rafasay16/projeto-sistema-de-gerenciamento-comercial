import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function gerarHistoricoGiga() {
  try {
    await client.connect();
    const db = client.db('gestao_loja');
    
    console.log("Starting 3-year data simulation...");

    const collections = {
      products: db.collection('products'),
      customers: db.collection('customers'),
      sales: db.collection('sales'),
      analytics: db.collection('analytics'),
      campaigns: db.collection('campaigns')
    };

    // Reset local database
    await Promise.all(Object.values(collections).map(c => c.deleteMany({})));

    // Product generation (200 items)
    const categorias = ["Hardware", "Periféricos", "Monitores", "Mobiliário", "Áudio", "Mobile", "Consoles", "Redes", "Laptops"];
    const marcas = ["Logitech", "Razer", "Corsair", "Dell", "Samsung", "Apple", "Asus", "Nvidia", "AMD", "Intel", "HyperX"];
    const nomesBase = ["Teclado", "Mouse", "Monitor", "Cadeira", "Headset", "GPU", "SSD", "iPhone", "PS5", "Roteador", "CPU", "Notebook"];
    
    const mockProducts = [];
    for (let i = 0; i < 200; i++) {
      let preco = Math.random() * 1800 + 40;
      if (Math.random() > 0.85) preco = Math.random() * 18000 + 4000;

      const critico = Math.random() < 0.20;
      const stock = critico ? Math.floor(Math.random() * 6) : Math.floor(Math.random() * 300) + 10;

      mockProducts.push({
        name: `${marcas[i % marcas.length]} ${nomesBase[i % nomesBase.length]} G${Math.floor(i/10)}`,
        category: categorias[i % categorias.length],
        price: parseFloat(preco.toFixed(2)),
        stock: stock,
        sku: `SKU-${Math.random().toString(36).substring(7).toUpperCase()}`,
        createdAt: new Date()
      });
    }
    await collections.products.insertMany(mockProducts);
    const products = await collections.products.find().toArray();

    // Customer generation (800 clients)
    const nomes = ["Ana", "João", "Carlos", "Marta", "Rui", "Sofia", "Pedro", "Beatriz", "Matheus", "Lucas", "Tiago", "Carla", "Ricardo", "Fernanda", "Gabriel", "Helena", "Vitor", "Bruna"];
    const apelidos = ["Silva", "Santos", "Ferreira", "Pereira", "Oliveira", "Costa", "Rodrigues", "Martins", "Almeida", "Melo", "Barbosa"];
    const estados = ["PB", "SP", "RJ", "MG", "RS", "PE", "BA", "SC"];

    const mockCustomers = [];
    for (let i = 0; i < 800; i++) {
      const nomeFull = `${nomes[Math.floor(Math.random() * nomes.length)]} ${apelidos[Math.floor(Math.random() * apelidos.length)]}`;
      const perfilRand = Math.random();
      let perfil = "low"; 
      if (perfilRand > 0.95) perfil = "high";
      else if (perfilRand > 0.82) perfil = "mid";

      mockCustomers.push({
        name: nomeFull,
        email: `${nomeFull.toLowerCase().replace(" ", ".")}${i}@gestao.com.br`,
        phone: `(83) 9${Math.floor(Math.random() * 90000000) + 10000000}`,
        address: `Rua Principal, ${i}, ${estados[Math.floor(Math.random() * estados.length)]}`,
        tier: "bronze",
        totalSpent: 0,
        loyaltyPoints: 0,
        perfil: perfil
      });
    }
    await collections.customers.insertMany(mockCustomers);
    let customers = await collections.customers.find().toArray();

    // Sales and Analytics (1095 days)
    const salesToInsert = [];
    const analyticsToInsert = [];
    const hoje = new Date();
    const pagamentos = ["Pix", "Crédito", "Débito", "Boleto"];

    for (let diasAtras = 1095; diasAtras >= 0; diasAtras--) {
      const dataAtual = new Date(hoje);
      dataAtual.setDate(hoje.getDate() - diasAtras);
      const dataString = dataAtual.toISOString().split('T')[0];
      
      const mes = dataAtual.getMonth();
      const isBlackFriday = (mes === 10);
      const isNatal = (mes === 11);
      const isWeekend = dataAtual.getDay() === 0 || dataAtual.getDay() === 6;
      
      let boost = isBlackFriday ? 4.8 : (isNatal ? 2.5 : (isWeekend ? 1.7 : 1.0));
      
      const visitors = Math.floor((Math.random() * 600 + 200) * boost);
      let faturamentoDoDia = 0;
      let vendasNoDia = 0;

      customers.forEach(customer => {
        let chance = 0.004 * boost; 
        if (customer.perfil === "high") chance = 0.05 * boost;
        if (customer.perfil === "mid") chance = 0.015 * boost;

        if (Math.random() < chance) {
          const numItens = Math.floor(Math.random() * 3) + 1;
          const itensVenda = [];
          let subtotal = 0;

          for (let j = 0; j < numItens; j++) {
            const produto = products[Math.floor(Math.random() * products.length)];
            itensVenda.push({
              productId: produto._id.toString(),
              productName: produto.name,
              quantity: 1,
              price: produto.price,
              total: produto.price
            });
            subtotal += produto.price;
          }

          salesToInsert.push({
            customerId: customer._id.toString(),
            customerName: customer.name,
            items: itensVenda,
            paymentMethod: pagamentos[Math.floor(Math.random() * pagamentos.length)],
            total: parseFloat(subtotal.toFixed(2)),
            createdAt: new Date(dataAtual.setHours(9 + Math.floor(Math.random() * 12)))
          });

          faturamentoDoDia += subtotal;
          customer.totalSpent += subtotal;
          customer.loyaltyPoints += Math.floor(subtotal / 10);
          vendasNoDia++;
        }
      });

      analyticsToInsert.push({
        date: dataString,
        visitors,
        pageViews: visitors * Math.floor(Math.random() * 5 + 3),
        revenue: parseFloat(faturamentoDoDia.toFixed(2)),
        conversions: vendasNoDia,
        conversionRate: visitors > 0 ? parseFloat(((vendasNoDia / visitors) * 100).toFixed(2)) : 0,
        bounceRate: parseFloat((Math.random() * 15 + 20).toFixed(2)),
        deviceBreakdown: { mobile: Math.floor(visitors * 0.78), desktop: Math.floor(visitors * 0.22) }
      });
      
      if (salesToInsert.length > 5000) {
        await collections.sales.insertMany(salesToInsert.splice(0, salesToInsert.length));
      }
    }

    // Final Tier consolidation
    for (let c of customers) {
      let tier = "bronze";
      if (c.totalSpent >= 15000) tier = "ouro";
      else if (c.totalSpent >= 7000) tier = "prata";

      await collections.customers.updateOne(
        { _id: c._id },
        { $set: { 
            tier, 
            totalSpent: parseFloat(c.totalSpent.toFixed(2)), 
            loyaltyPoints: c.loyaltyPoints,
            address: c.address,
            phone: c.phone
          }, 
          $unset: { perfil: "" } 
        }
      );
    }

    // Marketing Campaigns
    const plataformas = ["Meta Ads", "Google Ads", "TikTok Ads", "E-mail Marketing", "SEO", "Influenciadores"];
    const campaignsToInsert = Array.from({ length: 40 }).map((_, i) => {
      const budget = Math.random() * 15000 + 2000;
      const spent = Math.random() * budget;
      const conversions = Math.floor(spent / (Math.random() * 50 + 10));
      return {
        name: `Campaign ${i + 1}`,
        platform: plataformas[i % plataformas.length],
        status: i < 5 ? "Ativa" : "Concluída",
        budget: parseFloat(budget.toFixed(2)),
        spent: parseFloat(spent.toFixed(2)),
        impressions: Math.floor(spent * 60),
        clicks: Math.floor(spent * 4),
        conversions,
        roi: spent > 0 ? parseFloat(((conversions * 400 - spent) / spent).toFixed(2)) : 0,
        startDate: "2023-01-01",
        endDate: "2026-03-31"
      };
    });

    if (salesToInsert.length > 0) await collections.sales.insertMany(salesToInsert);
    await collections.analytics.insertMany(analyticsToInsert);
    await collections.campaigns.insertMany(campaignsToInsert);

    console.log("Database seed completed successfully.");

  } catch (error) {
    console.error("Seed error:", error);
  } finally {
    await client.close();
  }
}

gerarHistoricoGiga();