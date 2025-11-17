import envConfig from "src/shared/config";
import { RoleName } from "src/shared/constants/role.constant";
import { HashingService } from "src/shared/services/hashing.service";
import { PrismaService } from "src/shared/services/prisma.service"

const prisma = new PrismaService()
const hash = new HashingService()

const main = async () => {
    const {ADMIN_PASSWORD,ADMIN_EMAIL,ADMIN_NAME,ADMIN_PHONE_NUMBER} = envConfig

    const roleCount = await prisma.role.count();

    if(roleCount > 0){
        throw new Error('Roles already exist')
    }

    const data = [
        {
            name:RoleName.Admin,
            description: 'Admin role'
        },
        {
            name:RoleName.Client,
            description: 'Client role'
        },
        {
            name:RoleName.Seller,
            description: 'Seller role'
        }
    ]

    const roles = await prisma.role.createMany({
        data
    })

    const adminRole = await prisma.role.findUniqueOrThrow({
        where:{
            name: RoleName.Admin
        }
    })

    const hashedPassword = await hash.hash(ADMIN_PASSWORD)

    const adminUserCreate = await prisma.user.create({
        data:{
            email: ADMIN_EMAIL,
            password: hashedPassword,
            name: ADMIN_NAME,
            phoneNumber: ADMIN_PHONE_NUMBER,
            roleId: adminRole.id
        }
    })

    return {
        createdRole: roles,
        adminUserCreate
    }
}

main().then(({adminUserCreate,createdRole})=>{
    console.log(`Created ${createdRole}`);
    console.log(`Created admin user ${adminUserCreate}`);
})