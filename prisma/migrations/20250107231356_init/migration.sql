-- CreateTable
CREATE TABLE `Listener` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NOT NULL,
    `age` INTEGER NOT NULL,
    `language` VARCHAR(191) NOT NULL,
    `favoriteFood` VARCHAR(191) NOT NULL,
    `hobbies` VARCHAR(191) NOT NULL,
    `idols` VARCHAR(191) NOT NULL,
    `sex` ENUM('MALE', 'FEMALE') NOT NULL,
    `about` VARCHAR(191) NOT NULL,
    `device_token` VARCHAR(191) NOT NULL,
    `device_token2` VARCHAR(191) NOT NULL,
    `online_status` BOOLEAN NOT NULL DEFAULT false,
    `busy_status` BOOLEAN NOT NULL DEFAULT false,
    `ac_delete` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `wallet` INTEGER NOT NULL DEFAULT 0,
    `leaveAvailable` INTEGER NOT NULL DEFAULT 4,
    `updateProfile` ENUM('TRUE', 'FALSE', 'WAITING') NOT NULL DEFAULT 'FALSE',

    UNIQUE INDEX `Listener_email_key`(`email`),
    INDEX `Listener_name_idx`(`name`),
    INDEX `Listener_device_token2_idx`(`device_token2`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PendingProfile` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `image` VARCHAR(191) NULL,
    `language` VARCHAR(191) NULL,
    `favoriteFood` VARCHAR(191) NULL,
    `hobbies` VARCHAR(191) NULL,
    `idols` VARCHAR(191) NULL,
    `about` VARCHAR(191) NULL,
    `listenerId` INTEGER NOT NULL,

    UNIQUE INDEX `PendingProfile_listenerId_key`(`listenerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MissedMeeting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `listenerId` INTEGER NOT NULL,
    `scheduledAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `attended` BOOLEAN NOT NULL DEFAULT false,
    `attendedAt` DATETIME(3) NULL,

    INDEX `MissedMeeting_listenerId_idx`(`listenerId`),
    INDEX `MissedMeeting_scheduledAt_idx`(`scheduledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Penalty` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `listenerId` INTEGER NOT NULL,
    `penaltyMode` ENUM('TRUANCY', 'MISSED_MEETING', 'LEFTCALL') NOT NULL,
    `amount` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `missedMeetingId` INTEGER NOT NULL,

    INDEX `Penalty_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NULL DEFAULT 'Anonymous',
    `email` VARCHAR(191) NOT NULL,
    `image` VARCHAR(191) NULL,
    `device_token` VARCHAR(191) NOT NULL,
    `device_token2` VARCHAR(191) NOT NULL,
    `interests` ENUM('CASUAL_RELATIONSHIP', 'DATING', 'SERIOUS_DATING') NULL,
    `age` INTEGER NULL,
    `sex` ENUM('MALE', 'FEMALE') NULL,
    `bio` VARCHAR(191) NULL,
    `language` VARCHAR(191) NULL,
    `relationship` VARCHAR(191) NULL,
    `star_sign` VARCHAR(191) NULL,
    `pets` VARCHAR(191) NULL,
    `drinking` ENUM('YES', 'NO') NULL,
    `smoking` ENUM('YES', 'NO') NULL,
    `busy_status` BOOLEAN NOT NULL DEFAULT false,
    `ac_delete` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `wallet` INTEGER NOT NULL DEFAULT 0,
    `verified` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `User_email_key`(`email`),
    INDEX `User_device_token2_idx`(`device_token2`),
    INDEX `User_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User_work` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `company` VARCHAR(191) NULL,
    `position` VARCHAR(191) NULL,
    `start_year` INTEGER NULL,
    `end_year` INTEGER NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User_education` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `qualificationType` VARCHAR(191) NULL,
    `institutionName` VARCHAR(191) NULL,
    `start_year` INTEGER NULL,
    `end_year` INTEGER NULL,
    `userId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `listenerId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `listenerShare` DOUBLE NOT NULL,
    `appShare` DOUBLE NOT NULL,
    `mode` ENUM('VIDEO_CALL', 'VOICE_CALL', 'CHAT') NOT NULL,
    `duration` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Transaction_userId_idx`(`userId`),
    INDEX `Transaction_listenerId_idx`(`listenerId`),
    INDEX `Transaction_mode_idx`(`mode`),
    INDEX `Transaction_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MissedCall` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `listenerId` INTEGER NOT NULL,
    `mode` ENUM('VIDEO_CALL', 'VOICE_CALL', 'CHAT') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MissedCall_userId_idx`(`userId`),
    INDEX `MissedCall_listenerId_idx`(`listenerId`),
    INDEX `MissedCall_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Deposit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `orderId` VARCHAR(191) NOT NULL,
    `signatureId` VARCHAR(191) NOT NULL,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'RECHARGE',
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `Deposit_userId_idx`(`userId`),
    INDEX `Deposit_status_idx`(`status`),
    INDEX `Deposit_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Withdraw` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `listenerId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `mode` VARCHAR(191) NOT NULL DEFAULT 'WITHDRAW',
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `paymentMode` ENUM('UPI', 'BANK') NOT NULL,
    `upi_id` VARCHAR(191) NULL,
    `account_number` INTEGER NULL,
    `ifsc_code` INTEGER NULL,
    `requestApproveAdmin` ENUM('TRUE', 'FALSE', 'WAITING') NOT NULL DEFAULT 'WAITING',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Withdraw_listenerId_idx`(`listenerId`),
    INDEX `Withdraw_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LeaveRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `listenerId` INTEGER NOT NULL,
    `days` INTEGER NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LeaveRequest_listenerId_idx`(`listenerId`),
    INDEX `LeaveRequest_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ConnectionRequest` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `listenerId` INTEGER NOT NULL,
    `communicationType` ENUM('VIDEO_CALL', 'VOICE_CALL', 'CHAT') NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ConnectionRequest_userId_idx`(`userId`),
    INDEX `ConnectionRequest_listenerId_idx`(`listenerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `GeneralNotification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NULL,
    `image_URL` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` ENUM('ALL', 'USER', 'LISTENER') NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SpecificNotification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `link` VARCHAR(191) NULL,
    `image_URL` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `type` ENUM('ALL', 'USER', 'LISTENER') NOT NULL,
    `userId` INTEGER NULL,
    `listenerId` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageListener` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `senderId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MessageUser` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `senderId` INTEGER NOT NULL,
    `receiverId` INTEGER NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_BlockedUsers` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_BlockedUsers_AB_unique`(`A`, `B`),
    INDEX `_BlockedUsers_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PendingProfile` ADD CONSTRAINT `PendingProfile_listenerId_fkey` FOREIGN KEY (`listenerId`) REFERENCES `Listener`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MissedMeeting` ADD CONSTRAINT `MissedMeeting_listenerId_fkey` FOREIGN KEY (`listenerId`) REFERENCES `Listener`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Penalty` ADD CONSTRAINT `Penalty_listenerId_fkey` FOREIGN KEY (`listenerId`) REFERENCES `Listener`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Penalty` ADD CONSTRAINT `Penalty_missedMeetingId_fkey` FOREIGN KEY (`missedMeetingId`) REFERENCES `MissedMeeting`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_work` ADD CONSTRAINT `User_work_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `User_education` ADD CONSTRAINT `User_education_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_listenerId_fkey` FOREIGN KEY (`listenerId`) REFERENCES `Listener`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MissedCall` ADD CONSTRAINT `MissedCall_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MissedCall` ADD CONSTRAINT `MissedCall_listenerId_fkey` FOREIGN KEY (`listenerId`) REFERENCES `Listener`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Deposit` ADD CONSTRAINT `Deposit_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Withdraw` ADD CONSTRAINT `Withdraw_listenerId_fkey` FOREIGN KEY (`listenerId`) REFERENCES `Listener`(`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LeaveRequest` ADD CONSTRAINT `LeaveRequest_listenerId_fkey` FOREIGN KEY (`listenerId`) REFERENCES `Listener`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConnectionRequest` ADD CONSTRAINT `ConnectionRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ConnectionRequest` ADD CONSTRAINT `ConnectionRequest_listenerId_fkey` FOREIGN KEY (`listenerId`) REFERENCES `Listener`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecificNotification` ADD CONSTRAINT `SpecificNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SpecificNotification` ADD CONSTRAINT `SpecificNotification_listenerId_fkey` FOREIGN KEY (`listenerId`) REFERENCES `Listener`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageListener` ADD CONSTRAINT `MessageListener_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageListener` ADD CONSTRAINT `MessageListener_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `Listener`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageUser` ADD CONSTRAINT `MessageUser_senderId_fkey` FOREIGN KEY (`senderId`) REFERENCES `Listener`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MessageUser` ADD CONSTRAINT `MessageUser_receiverId_fkey` FOREIGN KEY (`receiverId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BlockedUsers` ADD CONSTRAINT `_BlockedUsers_A_fkey` FOREIGN KEY (`A`) REFERENCES `Listener`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_BlockedUsers` ADD CONSTRAINT `_BlockedUsers_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
