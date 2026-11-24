package com.anmol.bazaar.main.common.config;

import com.anmol.bazaar.main.auth.model.AppUser;
import com.anmol.bazaar.main.auth.model.Role;
import com.anmol.bazaar.main.auth.repository.AppUserRepository;
import com.anmol.bazaar.main.catalog.model.Category;
import com.anmol.bazaar.main.catalog.model.Item;
import com.anmol.bazaar.main.catalog.model.SubCategory;
import com.anmol.bazaar.main.catalog.repository.CategoryRepository;
import com.anmol.bazaar.main.catalog.repository.ItemRepository;
import com.anmol.bazaar.main.catalog.repository.SubCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final SubCategoryRepository subCategoryRepository;
    private final ItemRepository itemRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        // 1. Seed default users idempotently without count == 0 condition
        seedUserIfMissing("admin@bazaarone.in", "Anmol Sharma (Admin)", "9876543210", "admin123", Role.ADMIN);
        seedUserIfMissing("subadmin@bazaarone.in", "Riya Kapoor (Store Manager)", "9876543211", "subadmin123", Role.SUB_ADMIN);
        seedUserIfMissing("user@bazaarone.in", "Aarav Verma", "9876543212", "user123", Role.USER);

        // 2. Seed store categories
        Category groceries = getOrCreateCategory("Groceries & Pantry", "Fresh organic produce, single-origin coffee, cold-pressed oils, and daily staples");
        Category electronics = getOrCreateCategory("Electronics & Gadgets", "Smartphones, wireless audio, kitchen appliances, and everyday tech");
        Category homeKitchen = getOrCreateCategory("Home & Kitchen", "Cookware, ceramic tableware, storage jars, and home organization");
        Category fashion = getOrCreateCategory("Fashion & Accessories", "Everyday apparel, sneakers, backpacks, and wristwatches");
        Category personalCare = getOrCreateCategory("Personal Care & Wellness", "Botanical skincare, grooming kits, and daily wellness essentials");
        Category stationery = getOrCreateCategory("Books & Stationery", "Hardcover notebooks, fountain pens, desk organizers, and planners");

        // 3. Seed sub-categories
        SubCategory coffeeTea = getOrCreateSubCategory("Coffee, Tea & Beverages", "Artisan roasted beans, matcha, and organic honey", groceries);
        SubCategory pantryStaples = getOrCreateSubCategory("Organic Staples & Snacks", "Cold-pressed olive oil, nuts, and whole grains", groceries);
        SubCategory audioGadgets = getOrCreateSubCategory("Audio & Smart Devices", "Earbuds, smart speakers, and portable chargers", electronics);
        SubCategory cookware = getOrCreateSubCategory("Cookware & Tableware", "Cast iron skillets, stoneware bowls, and glass bottles", homeKitchen);
        SubCategory bagsFootwear = getOrCreateSubCategory("Bags & Everyday Wear", "Canvas totes, commuter backpacks, and classic sneakers", fashion);
        SubCategory skincare = getOrCreateSubCategory("Skincare & Bath", "Vitamin C serums, cold-processed soaps, and moisturizers", personalCare);
        SubCategory deskSupplies = getOrCreateSubCategory("Notebooks & Pens", "Fountain-pen friendly journals and brass stationery", stationery);

        // 4. Seed 16 items (exactly 2 pages of 8 items per page)
        List<Item> initialItems = List.of(
                // --- Page 1 Items (1 - 8) ---
                Item.builder()
                        .name("Chikmagalur Single-Origin Arabica Coffee Beans")
                        .description("Medium-dark roast 100% Arabica whole beans with notes of dark chocolate and toasted hazelnut.")
                        .price(new BigDecimal("549.00"))
                        .originalPrice(new BigDecimal("699.00"))
                        .stockQuantity(45)
                        .brand("Blue Mountain Roasters")
                        .unitLabel("500 g Pack")
                        .imageUrl("https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=900&q=85")
                        .subCategory(coffeeTea)
                        .featured(true)
                        .build(),
                Item.builder()
                        .name("Extra Virgin Cold-Pressed Olive Oil")
                        .description("First-press Mediterranean extra virgin olive oil in UV-protected dark glass bottle for cooking and salads.")
                        .price(new BigDecimal("899.00"))
                        .originalPrice(new BigDecimal("1099.00"))
                        .stockQuantity(32)
                        .brand("Verde Harvest")
                        .unitLabel("750 ml Bottle")
                        .imageUrl("https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=900&q=85")
                        .subCategory(pantryStaples)
                        .featured(true)
                        .build(),
                Item.builder()
                        .name("SonicBuds Pro Active Noise Cancelling Earbuds")
                        .description("Bluetooth 5.4 wireless earbuds with 36-hour charging case, dual-mic call clarity, and IPX5 water resistance.")
                        .price(new BigDecimal("3499.00"))
                        .originalPrice(new BigDecimal("4999.00"))
                        .stockQuantity(20)
                        .brand("SoundCraft")
                        .unitLabel("1 Box")
                        .imageUrl("https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=900&q=85")
                        .subCategory(audioGadgets)
                        .featured(true)
                        .build(),
                Item.builder()
                        .name("Pre-Seasoned Cast Iron Skillet Pan (10-Inch)")
                        .description("Heavy-duty induction-safe cast iron frying pan for searing, baking, and everyday Indian cooking.")
                        .price(new BigDecimal("1699.00"))
                        .originalPrice(new BigDecimal("2199.00"))
                        .stockQuantity(18)
                        .brand("HearthWare")
                        .unitLabel("10-Inch Pan")
                        .imageUrl("https://images.unsplash.com/photo-1584990347449-a2d4c2c044c9?auto=format&fit=crop&w=900&q=85")
                        .subCategory(cookware)
                        .featured(false)
                        .build(),
                Item.builder()
                        .name("Urban Canvas & Leather Commuter Backpack")
                        .description("Water-resistant 16oz waxed cotton canvas backpack with padded 16-inch laptop compartment.")
                        .price(new BigDecimal("2499.00"))
                        .originalPrice(new BigDecimal("3299.00"))
                        .stockQuantity(16)
                        .brand("CarryAll")
                        .unitLabel("22L Capacity")
                        .imageUrl("https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=900&q=85")
                        .subCategory(bagsFootwear)
                        .featured(true)
                        .build(),
                Item.builder()
                        .name("Botanical Vitamin C & Hyaluronic Face Serum")
                        .description("Lightweight daily brightening serum with 10% stabilized Vitamin C, ferulic acid, and plant squalane.")
                        .price(new BigDecimal("649.00"))
                        .originalPrice(new BigDecimal("799.00"))
                        .stockQuantity(40)
                        .brand("PureLeaf Apothecary")
                        .unitLabel("30 ml Dropper")
                        .imageUrl("https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=900&q=85")
                        .subCategory(skincare)
                        .featured(false)
                        .build(),
                Item.builder()
                        .name("Linen Hardcover Dotted Bullet Journal (A5)")
                        .description("120 GSM acid-free ivory paper, lay-flat Smyth-sewn binding, two ribbon bookmarks, and expandable back pocket.")
                        .price(new BigDecimal("449.00"))
                        .originalPrice(new BigDecimal("599.00"))
                        .stockQuantity(55)
                        .brand("PaperMill Co.")
                        .unitLabel("192 Pages")
                        .imageUrl("https://images.unsplash.com/photo-1531346878377-a5be20888e57?auto=format&fit=crop&w=900&q=85")
                        .subCategory(deskSupplies)
                        .featured(false)
                        .build(),
                Item.builder()
                        .name("Wildflower Raw Multiflora Forest Honey")
                        .description("Unprocessed, NMR-tested pure raw honey harvested sustainably from Himalayan foothills.")
                        .price(new BigDecimal("399.00"))
                        .originalPrice(new BigDecimal("499.00"))
                        .stockQuantity(60)
                        .brand("Nectar Valley")
                        .unitLabel("500 g Glass Jar")
                        .imageUrl("https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=900&q=85")
                        .subCategory(pantryStaples)
                        .featured(true)
                        .build(),

                // --- Page 2 Items (9 - 16) ---
                Item.builder()
                        .name("Organic Darjeeling First Flush Green Tea")
                        .description("Hand-picked whole-leaf green tea from high-altitude Himalayan estates with delicate floral aroma.")
                        .price(new BigDecimal("399.00"))
                        .originalPrice(new BigDecimal("499.00"))
                        .stockQuantity(50)
                        .brand("Makaibari Estate")
                        .unitLabel("250 g Tin")
                        .imageUrl("https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=900&q=85")
                        .subCategory(coffeeTea)
                        .featured(false)
                        .build(),
                Item.builder()
                        .name("French Press Coffee & Tea Plunger (600 ml)")
                        .description("Borosilicate thermal glass carafe with multi-level stainless steel fine mesh filter.")
                        .price(new BigDecimal("1199.00"))
                        .originalPrice(new BigDecimal("1599.00"))
                        .stockQuantity(24)
                        .brand("HearthWare")
                        .unitLabel("600 ml Carafe")
                        .imageUrl("https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=900&q=85")
                        .subCategory(cookware)
                        .featured(true)
                        .build(),
                Item.builder()
                        .name("MagSafe Fast Magnetic Wireless Charger (15W)")
                        .description("Ultra-slim aluminum wireless charging pad with braided nylon USB-C cable and temperature safety sensors.")
                        .price(new BigDecimal("1499.00"))
                        .originalPrice(new BigDecimal("2199.00"))
                        .stockQuantity(30)
                        .brand("SoundCraft")
                        .unitLabel("1 Unit")
                        .imageUrl("https://images.unsplash.com/photo-1622445262464-84b1456045b6?auto=format&fit=crop&w=900&q=85")
                        .subCategory(audioGadgets)
                        .featured(true)
                        .build(),
                Item.builder()
                        .name("Handcrafted Ceramic Coffee Mug Set (Set of 2)")
                        .description("Artisan wheel-thrown stoneware mugs with speckled matte glaze and ergonomic comfortable handle.")
                        .price(new BigDecimal("699.00"))
                        .originalPrice(new BigDecimal("899.00"))
                        .stockQuantity(35)
                        .brand("ClayCraft Studio")
                        .unitLabel("Set of 2 (320 ml)")
                        .imageUrl("https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=900&q=85")
                        .subCategory(cookware)
                        .featured(false)
                        .build(),
                Item.builder()
                        .name("Classic Polarized UV400 Aviator Sunglasses")
                        .description("Lightweight titanium-alloy frame with scratch-resistant TAC polarized lenses and protective hard case.")
                        .price(new BigDecimal("1799.00"))
                        .originalPrice(new BigDecimal("2499.00"))
                        .stockQuantity(20)
                        .brand("CarryAll")
                        .unitLabel("1 Pair")
                        .imageUrl("https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=900&q=85")
                        .subCategory(bagsFootwear)
                        .featured(false)
                        .build(),
                Item.builder()
                        .name("Organic Cold-Pressed Sweet Almond Oil")
                        .description("100% pure unrefined almond oil rich in Vitamin E for hair, skin nourishment, and body massage.")
                        .price(new BigDecimal("499.00"))
                        .originalPrice(new BigDecimal("649.00"))
                        .stockQuantity(40)
                        .brand("PureLeaf Apothecary")
                        .unitLabel("200 ml Bottle")
                        .imageUrl("https://images.unsplash.com/photo-1608248597359-5776d54c0384?auto=format&fit=crop&w=900&q=85")
                        .subCategory(skincare)
                        .featured(true)
                        .build(),
                Item.builder()
                        .name("Brass Vintage Nib Fountain Pen with Converter")
                        .description("Solid brushed brass body with iridium-tipped fine nib, includes refillable piston ink converter.")
                        .price(new BigDecimal("849.00"))
                        .originalPrice(new BigDecimal("1199.00"))
                        .stockQuantity(28)
                        .brand("PaperMill Co.")
                        .unitLabel("1 Pen in Gift Box")
                        .imageUrl("https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=900&q=85")
                        .subCategory(deskSupplies)
                        .featured(false)
                        .build(),
                Item.builder()
                        .name("Roasted California Almonds & Walnuts Medley")
                        .description("Slow dry-roasted non-pareil almonds and Chilean walnut kernels with light pink Himalayan salt.")
                        .price(new BigDecimal("629.00"))
                        .originalPrice(new BigDecimal("799.00"))
                        .stockQuantity(45)
                        .brand("Verde Harvest")
                        .unitLabel("400 g Pack")
                        .imageUrl("https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=900&q=85")
                        .subCategory(pantryStaples)
                        .featured(true)
                        .build()
        );

        for (Item item : initialItems) {
            seedItemIfMissing(item);
        }
    }

    private void seedUserIfMissing(String email, String fullName, String phone, String password, Role role) {
        if (!userRepository.existsByEmail(email)) {
            userRepository.save(AppUser.builder()
                    .fullName(fullName)
                    .email(email)
                    .phoneNumber(phone)
                    .password(passwordEncoder.encode(password))
                    .role(role)
                    .build());
        }
    }

    private Category getOrCreateCategory(String name, String description) {
        return categoryRepository.findByNameIgnoreCase(name)
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name(name)
                        .description(description)
                        .build()));
    }

    private SubCategory getOrCreateSubCategory(String name, String description, Category category) {
        return subCategoryRepository.findByNameIgnoreCaseAndCategoryId(name, category.getId())
                .orElseGet(() -> subCategoryRepository.save(SubCategory.builder()
                        .name(name)
                        .description(description)
                        .category(category)
                        .build()));
    }

    private void seedItemIfMissing(Item item) {
        if (!itemRepository.existsByNameIgnoreCase(item.getName())) {
            itemRepository.save(item);
        }
    }
}
