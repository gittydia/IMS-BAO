"""
Seed script to populate the database with sample data
Run this after: python -m prisma db push
"""
import asyncio
from datetime import datetime, timedelta, time
from decimal import Decimal
from prisma import Prisma
from faker import Faker
import hashlib

fake = Faker()

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

async def seed_database():
    db = Prisma()
    await db.connect()
    
    print("🌱 Starting database seeding...")
    
    try:
        # Create authuser (10 admins + 10 students)
        print("Creating authuser...")
        authuser = []
        
        # Create 10 admin users (password: "admin123")
        for i in range(10):
            auth_user = await db.authuser.create(data={
                'email': f'admin{i+1}@example.com',
                'password': hash_password('admin123'),
                'role': 'admin'
            })
            authuser.append(auth_user)
        
        # Create 10 student users (password: "student123")
        for i in range(10):
            auth_user = await db.authuser.create(data={
                'email': f'student{i+1}@example.com',
                'password': hash_password('student123'),
                'role': 'student'
            })
            authuser.append(auth_user)
        
        print(f"✅ Created {len(authuser)} auth users")
        
        # Create Admins (20)
        print("Creating Admins...")
        admins = []
        for i in range(20):
            admin = await db.admin.create(
                data={
                    'firstname': fake.first_name(),
                    'lastname': fake.last_name(),
                    'userId': authuser[i].id if i < len(authuser) else None,
                }
            )
            admins.append(admin)
        print(f"✅ Created {len(admins)} admins")
        
        # Create Students (20)
        print("Creating Students...")
        students = []
        colleges = ['College of Engineering', 'College of Science', 'College of Business', 'College of Arts', 'College of Education']
        programs = ['Computer Science', 'Information Technology', 'Business Administration', 'Accountancy', 'Engineering']
        
        for i in range(20):
            student = await db.student.create(
                data={
                    'firstname': fake.first_name(),
                    'lastname': fake.last_name(),
                    'college': fake.random_element(colleges),
                    'program': fake.random_element(programs),
                    'userId': authuser[i].id if i < len(authuser) else None,
                }
            )
            students.append(student)
        print(f"✅ Created {len(students)} students")
        
        # Create Appointments (20)
        print("Creating Appointments...")
        appointment_purposes = ['Uniform Fitting', 'Book Inquiry', 'Order Pickup', 'Product Inquiry', 'General Consultation']
        statuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled']
        
        for i in range(20):
            date_app = fake.date_between(start_date='today', end_date='+30d')
            time_app = time(hour=fake.random_int(8, 16), minute=fake.random_element([0, 15, 30, 45]))
            
            appointment = await db.appointment.create(
                data={
                    'studentId': students[i % len(students)].studentId,
                    'adminId': admins[i % len(admins)].adminId,
                    'dateApp': datetime.combine(date_app, datetime.min.time()),
                    'timeApp': datetime.combine(date_app, time_app),
                    'purpose': fake.random_element(appointment_purposes),
                    'status': fake.random_element(statuses),
                }
            )
        print(f"✅ Created 20 appointments")
        
        # Create Products (20)
        print("Creating Products...")
        products = []
        categories = ['Book', 'Uniform', 'Supplies', 'Equipment']
        product_statuses = ['Available', 'Out of Stock', 'Limited Stock']
        
        for i in range(20):
            product = await db.product.create(
                data={
                    'productName': f"{fake.word().capitalize()} {fake.word().capitalize()}",
                    'productCategory': fake.random_element(categories),
                    'price': Decimal(str(round(fake.random.uniform(100, 5000), 2))),
                    'status': fake.random_element(product_statuses),
                    'quantity': fake.random_int(0, 100),
                }
            )
            products.append(product)
        print(f"✅ Created {len(products)} products")
        
        # Create Books (20)
        print("Creating Books...")
        book_products = [p for p in products if p.productCategory == 'Book'][:5]
        if len(book_products) < 5:
            # Create more book products if needed
            for i in range(5 - len(book_products)):
                product = await db.product.create(
                    data={
                        'productName': f"{fake.word().capitalize()} Textbook",
                        'productCategory': 'Book',
                        'price': Decimal(str(round(fake.random.uniform(500, 2000), 2))),
                        'status': 'Available',
                        'quantity': fake.random_int(10, 50),
                    }
                )
                book_products.append(product)
        
        for i in range(20):
            book = await db.book.create(
                data={
                    'productId': book_products[i % len(book_products)].productId,
                    'author': fake.name(),
                    'professorName': f"Prof. {fake.last_name()}",
                    'edition': f"{fake.random_int(1, 5)}th Edition",
                }
            )
        print(f"✅ Created 20 books")
        
        # Create Uniforms (20)
        print("Creating Uniforms...")
        uniform_products = [p for p in products if p.productCategory == 'Uniform'][:5]
        if len(uniform_products) < 5:
            for i in range(5 - len(uniform_products)):
                product = await db.product.create(
                    data={
                        'productName': f"School Uniform {fake.word().capitalize()}",
                        'productCategory': 'Uniform',
                        'price': Decimal(str(round(fake.random.uniform(300, 1500), 2))),
                        'status': 'Available',
                        'quantity': fake.random_int(10, 100),
                    }
                )
                uniform_products.append(product)
        
        sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
        genders = ['Male', 'Female', 'Unisex']
        uniform_types = ['Polo Shirt', 'Pants', 'Skirt', 'PE Uniform', 'Lab Coat']
        
        for i in range(20):
            uniform = await db.uniform.create(
                data={
                    'productId': uniform_products[i % len(uniform_products)].productId,
                    'sizeType': fake.random_element(sizes),
                    'gender': fake.random_element(genders),
                    'type': fake.random_element(uniform_types),
                    'buyer': fake.company(),
                }
            )
        print(f"✅ Created 20 uniforms")
        
        # Create OtherGoods (20)
        print("Creating Other Goods...")
        other_products = [p for p in products if p.productCategory in ['Supplies', 'Equipment']][:5]
        if len(other_products) < 5:
            for i in range(5 - len(other_products)):
                product = await db.product.create(
                    data={
                        'productName': fake.word().capitalize(),
                        'productCategory': 'Supplies',
                        'price': Decimal(str(round(fake.random.uniform(50, 500), 2))),
                        'status': 'Available',
                        'quantity': fake.random_int(20, 200),
                    }
                )
                other_products.append(product)
        
        for i in range(20):
            other_good = await db.othergood.create(
                data={
                    'productId': other_products[i % len(other_products)].productId,
                    'description': fake.sentence(),
                }
            )
        print(f"✅ Created 20 other goods")
        
        # Create Orders (20)
        print("Creating Orders...")
        orders = []
        order_statuses = ['Pending', 'Ready', 'Claimed', 'Cancelled']
        
        for i in range(20):
            date_to_claim = fake.date_between(start_date='today', end_date='+14d')
            date_claimed = fake.date_between(start_date='today', end_date='+7d') if i % 3 == 0 else None
            
            order = await db.order.create(
                data={
                    'productId': products[i % len(products)].productId,
                    'dateToClaim': datetime.combine(date_to_claim, datetime.min.time()),
                    'dateClaimed': datetime.combine(date_claimed, datetime.min.time()) if date_claimed else None,
                    'status': fake.random_element(order_statuses),
                    'amount': Decimal(str(round(fake.random.uniform(100, 5000), 2))),
                }
            )
            orders.append(order)
        print(f"✅ Created {len(orders)} orders")
        
        # Create Transactions (20)
        print("Creating Transactions...")
        for i in range(20):
            transaction = await db.transaction.create(
                data={
                    'orderId': orders[i % len(orders)].orderId,
                    'studentId': students[i % len(students)].studentId,
                }
            )
        print(f"✅ Created 20 transactions")
        
        print("\n🎉 Database seeding completed successfully!")
        print(f"📊 Summary:")
        print(f"   - 20 Auth Users")
        print(f"   - 20 Admins")
        print(f"   - 20 Students")
        print(f"   - 20 Appointments")
        print(f"   - {len(products)} Products")
        print(f"   - 20 Books")
        print(f"   - 20 Uniforms")
        print(f"   - 20 Other Goods")
        print(f"   - 20 Orders")
        print(f"   - 20 Transactions")
        
    except Exception as e:
        print(f"❌ Error during seeding: {e}")
        raise
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(seed_database())
