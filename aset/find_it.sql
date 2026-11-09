-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: mariadb:3306
-- Generation Time: Nov 07, 2026 at 10:02 PM
-- Server version: 12.3.3-MariaDB-ubu2404
-- PHP Version: 8.3.36

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `find_it`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_log`
--

CREATE TABLE `audit_log` (
  `id_log` int(11) NOT NULL,
  `id_user` int(11) DEFAULT NULL,
  `aktivitas` varchar(100) NOT NULL,
  `tabel_referensi` varchar(50) NOT NULL,
  `id_referensi` int(11) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `barang`
--

CREATE TABLE `barang` (
  `id_barang` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `id_kategori` int(11) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `lokasi` varchar(255) NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `tanggal_kejadian` date NOT NULL,
  `status` enum('Hilang','Ditemukan','Dikembalikan') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `fakultas`
--

CREATE TABLE `fakultas` (
  `id_fakultas` int(11) NOT NULL,
  `nama_fakultas` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `fakultas`
--

INSERT INTO `fakultas` (`id_fakultas`, `nama_fakultas`) VALUES
(1, 'Fak. Adab dan Humaniora'),
(2, 'Fak. Dakwah dan Komunikasi'),
(3, 'Fak. Ekonomi dan Bisnis Islam'),
(4, 'Fak. Ilmu Sosial dan Ilmu Politik'),
(5, 'Fak. Kedokteran'),
(6, 'Fak. Psikologi dan Kesehatan'),
(7, 'Fak. Sains dan Teknologi'),
(8, 'Fak. Syariah dan Hukum'),
(9, 'Fak. Tarbiyah dan Ilmu Keguruan'),
(10, 'Fak. Ushuluddin dan Filsafat'),
(11, 'Pascasarjana');

-- --------------------------------------------------------

--
-- Table structure for table `foto_barang`
--

CREATE TABLE `foto_barang` (
  `id_foto` int(11) NOT NULL,
  `id_barang` int(11) NOT NULL,
  `foto_url` varchar(255) NOT NULL,
  `storage_key` varchar(255) DEFAULT NULL,
  `is_utama` tinyint(1) NOT NULL DEFAULT 0,
  `urutan_foto` tinyint(4) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategori`
--

CREATE TABLE `kategori` (
  `id_kategori` int(11) NOT NULL,
  `nama_kategori` varchar(100) NOT NULL,
  `id_user_pembuat` int(11) DEFAULT NULL,
  `status_verifikasi` enum('Pending','Disetujui','Ditolak') NOT NULL DEFAULT 'Disetujui',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kategori`
--

INSERT INTO `kategori` (`id_kategori`, `nama_kategori`, `id_user_pembuat`, `status_verifikasi`, `is_active`, `created_at`) VALUES
(1, 'Elektronik', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(2, 'Handphone dan Aksesori', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(3, 'Komputer dan Perangkat', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(4, 'Dokumen dan Identitas', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(5, 'Dompet dan Uang', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(6, 'Kunci', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(7, 'Tas dan Ransel', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(8, 'Pakaian dan Aksesori', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(9, 'Buku dan Alat Tulis', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(10, 'Perlengkapan Ibadah', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(11, 'Kendaraan dan Aksesori', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(12, 'Perhiasan', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(13, 'Perlengkapan Pribadi', NULL, 'Disetujui', 1, '2026-11-07 22:01:16'),
(14, 'Lainnya', NULL, 'Disetujui', 1, '2026-11-07 22:01:16');

-- --------------------------------------------------------

--
-- Table structure for table `klaim`
--

CREATE TABLE `klaim` (
  `id_klaim` int(11) NOT NULL,
  `id_barang` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `alasan_klaim` text NOT NULL,
  `bukti_kepemilikan` varchar(255) DEFAULT NULL,
  `nomor_telepon_jaminan` varchar(20) NOT NULL,
  `status_klaim` enum('Pending','Diterima','Ditolak') NOT NULL DEFAULT 'Pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `laporan_konten`
--

CREATE TABLE `laporan_konten` (
  `id_laporan` int(11) NOT NULL,
  `id_user_pelapor` int(11) NOT NULL,
  `id_barang` int(11) NOT NULL,
  `alasan` varchar(100) NOT NULL,
  `deskripsi` text DEFAULT NULL,
  `status_laporan` enum('Pending','Diproses','Selesai') NOT NULL DEFAULT 'Pending',
  `id_admin` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifikasi`
--

CREATE TABLE `notifikasi` (
  `id_notifikasi` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `judul` varchar(255) NOT NULL,
  `pesan` text NOT NULL,
  `tipe` enum('chat','klaim','sistem') NOT NULL DEFAULT 'sistem',
  `id_barang` int(11) DEFAULT NULL,
  `id_klaim` int(11) DEFAULT NULL,
  `id_room` int(11) DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pesan`
--

CREATE TABLE `pesan` (
  `id_pesan` int(11) NOT NULL,
  `id_room` int(11) NOT NULL,
  `id_pengirim` int(11) NOT NULL,
  `tipe_pesan` enum('teks','gambar') NOT NULL DEFAULT 'teks',
  `isi_pesan` text NOT NULL,
  `attachment_url` varchar(255) DEFAULT NULL,
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `delivered_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `is_deleted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `prodi`
--

CREATE TABLE `prodi` (
  `id_prodi` int(11) NOT NULL,
  `id_fakultas` int(11) NOT NULL,
  `nama_prodi` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `prodi`
--

INSERT INTO `prodi` (`id_prodi`, `id_fakultas`, `nama_prodi`) VALUES
(1, 1, 'Bahasa dan Sastra Arab'),
(2, 1, 'Sastra Indonesia'),
(3, 1, 'Sastra Inggris'),
(4, 1, 'Sejarah Peradaban Islam'),
(5, 2, 'Bimbingan dan Konseling Islam'),
(6, 2, 'Ilmu Komunikasi'),
(7, 2, 'Komunikasi dan Penyiaran Islam'),
(8, 2, 'Magister Komunikasi dan Penyiaran Islam'),
(9, 2, 'Manajemen Dakwah'),
(10, 2, 'Pengembangan Masyarakat Islam'),
(11, 3, 'Akuntansi'),
(12, 3, 'Doktor Ekonomi Syariah'),
(13, 3, 'Ekonomi Syari\'ah'),
(14, 3, 'Ilmu Ekonomi'),
(15, 3, 'Magister Ekonomi Syariah'),
(16, 3, 'Manajemen'),
(17, 3, 'Manajemen Zakat dan Wakaf'),
(18, 4, 'Hubungan Internasional'),
(19, 4, 'Ilmu Politik'),
(20, 4, 'Sosiologi'),
(21, 5, 'Kedokteran'),
(22, 5, 'Pendidikan Profesi Dokter'),
(23, 6, 'Gizi'),
(24, 6, 'Psikologi'),
(25, 7, 'Arsitektur'),
(26, 7, 'Biologi'),
(27, 7, 'Ilmu Kelautan'),
(28, 7, 'Matematika'),
(29, 7, 'Sistem Informasi'),
(30, 7, 'Teknik Lingkungan'),
(31, 7, 'Teknik Sipil'),
(32, 8, 'Hukum'),
(33, 8, 'Hukum Ekonomi Syariah (Muamalah)'),
(34, 8, 'Hukum Keluarga Islam (Ahwal al Syakhsiyah)'),
(35, 8, 'Hukum Pidana Islam (Jinayah)'),
(36, 8, 'Hukum Tatanegara (Siyasah)'),
(37, 8, 'Ilmu Falak'),
(38, 8, 'Magister Hukum Tatanegara'),
(39, 8, 'Perbandingan Madzhab'),
(40, 9, 'Doktor Pendidikan Agama Islam'),
(41, 9, 'Magister Pendidikan Agama Islam'),
(42, 9, 'Magister Pendidikan Bahasa Arab'),
(43, 9, 'Magister Pendidikan Bahasa Inggris'),
(44, 9, 'Magister Pendidikan Guru Madrasah Ibtidaiyah'),
(45, 9, 'Manajemen Pendidikan Islam'),
(46, 9, 'Pendidikan Agama Islam'),
(47, 9, 'Pendidikan Bahasa Arab'),
(48, 9, 'Pendidikan Bahasa Inggris'),
(49, 9, 'Pendidikan Guru Madrasah Ibtidaiyah'),
(50, 9, 'Pendidikan Ilmu Pengetahuan Alam'),
(51, 9, 'Pendidikan Islam Anak Usia Dini'),
(52, 9, 'Pendidikan Matematika'),
(53, 10, 'Aqidah dan Filsafat Islam'),
(54, 10, 'Doktor Ilmu Al-Quran dan Tafsir'),
(55, 10, 'Ilmu Al Qur\'an dan Tafsir'),
(56, 10, 'Ilmu Hadist'),
(57, 10, 'Magister Aqidah dan Filsafat Islam'),
(58, 10, 'Magister Ilmu Al-Quran dan Tafsir'),
(59, 10, 'Magister Ilmu Hadist'),
(60, 10, 'Pemikiran Politik Islam'),
(61, 10, 'Studi Agama Agama'),
(62, 10, 'Tasawuf dan Psikoterapi'),
(63, 11, 'Doktor Studi Islam'),
(64, 11, 'Magister Studi Islam');

-- --------------------------------------------------------

--
-- Table structure for table `role`
--

CREATE TABLE `role` (
  `id_role` int(11) NOT NULL,
  `nama_role` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `room_chat`
--

CREATE TABLE `room_chat` (
  `id_room` int(11) NOT NULL,
  `id_barang` int(11) NOT NULL,
  `id_user1` int(11) NOT NULL,
  `id_user2` int(11) NOT NULL,
  `status_room` enum('Aktif','Dibekukan','Selesai') NOT NULL DEFAULT 'Aktif',
  `pesan_terakhir` text DEFAULT NULL,
  `waktu_pesan_terakhir` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `frozen_at` timestamp NULL DEFAULT NULL,
  `archived_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id_user` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `password_hash` varchar(255) DEFAULT NULL,
  `auth_provider` enum('email','google') NOT NULL DEFAULT 'email',
  `google_id` varchar(255) DEFAULT NULL,
  `nama` varchar(255) NOT NULL,
  `foto_profil` varchar(255) DEFAULT NULL,
  `telepon` varchar(20) DEFAULT NULL,
  `jenis_pengguna` enum('Mahasiswa','Dosen','Tendik','Umum') NOT NULL DEFAULT 'Mahasiswa',
  `status_aktif` enum('Aktif','Nonaktif') NOT NULL DEFAULT 'Aktif',
  `id_prodi` int(11) DEFAULT NULL,
  `id_role` int(11) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user_device`
--

CREATE TABLE `user_device` (
  `id_device` int(11) NOT NULL,
  `id_user` int(11) NOT NULL,
  `expo_push_token` varchar(255) NOT NULL,
  `platform` enum('Android','iOS','Web') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_active_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id_log`),
  ADD KEY `idx_audit_user` (`id_user`),
  ADD KEY `idx_audit_ref` (`tabel_referensi`,`id_referensi`);

--
-- Indexes for table `barang`
--
ALTER TABLE `barang`
  ADD PRIMARY KEY (`id_barang`),
  ADD KEY `idx_barang_feed` (`id_kategori`,`status`),
  ADD KEY `idx_barang_user` (`id_user`,`created_at`);

--
-- Indexes for table `fakultas`
--
ALTER TABLE `fakultas`
  ADD PRIMARY KEY (`id_fakultas`);

--
-- Indexes for table `foto_barang`
--
ALTER TABLE `foto_barang`
  ADD PRIMARY KEY (`id_foto`),
  ADD KEY `fk_foto_barang` (`id_barang`);

--
-- Indexes for table `kategori`
--
ALTER TABLE `kategori`
  ADD PRIMARY KEY (`id_kategori`),
  ADD UNIQUE KEY `uk_nama_kategori` (`nama_kategori`),
  ADD KEY `fk_kategori_user` (`id_user_pembuat`);

--
-- Indexes for table `klaim`
--
ALTER TABLE `klaim`
  ADD PRIMARY KEY (`id_klaim`),
  ADD KEY `idx_klaim_barang_status` (`id_barang`,`status_klaim`),
  ADD KEY `fk_klaim_user` (`id_user`);

--
-- Indexes for table `laporan_konten`
--
ALTER TABLE `laporan_konten`
  ADD PRIMARY KEY (`id_laporan`),
  ADD KEY `fk_lap_pelapor` (`id_user_pelapor`),
  ADD KEY `fk_lap_barang` (`id_barang`);

--
-- Indexes for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD PRIMARY KEY (`id_notifikasi`),
  ADD KEY `idx_notif_user_read` (`id_user`,`is_read`,`created_at`),
  ADD KEY `fk_notif_barang` (`id_barang`),
  ADD KEY `fk_notif_klaim` (`id_klaim`),
  ADD KEY `fk_notif_room` (`id_room`);

--
-- Indexes for table `pesan`
--
ALTER TABLE `pesan`
  ADD PRIMARY KEY (`id_pesan`),
  ADD KEY `idx_pesan_room_time` (`id_room`,`sent_at`),
  ADD KEY `fk_pesan_pengirim` (`id_pengirim`);

--
-- Indexes for table `prodi`
--
ALTER TABLE `prodi`
  ADD PRIMARY KEY (`id_prodi`),
  ADD KEY `fk_prodi_fakultas` (`id_fakultas`);

--
-- Indexes for table `role`
--
ALTER TABLE `role`
  ADD PRIMARY KEY (`id_role`);

--
-- Indexes for table `room_chat`
--
ALTER TABLE `room_chat`
  ADD PRIMARY KEY (`id_room`),
  ADD UNIQUE KEY `uk_room_participants` (`id_barang`,`id_user1`,`id_user2`),
  ADD KEY `fk_room_user1` (`id_user1`),
  ADD KEY `fk_room_user2` (`id_user2`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id_user`),
  ADD UNIQUE KEY `uk_user_email` (`email`),
  ADD UNIQUE KEY `uk_user_google` (`google_id`),
  ADD KEY `fk_user_prodi` (`id_prodi`),
  ADD KEY `fk_user_role` (`id_role`);

--
-- Indexes for table `user_device`
--
ALTER TABLE `user_device`
  ADD PRIMARY KEY (`id_device`),
  ADD KEY `fk_device_user` (`id_user`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id_log` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `barang`
--
ALTER TABLE `barang`
  MODIFY `id_barang` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `fakultas`
--
ALTER TABLE `fakultas`
  MODIFY `id_fakultas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `foto_barang`
--
ALTER TABLE `foto_barang`
  MODIFY `id_foto` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kategori`
--
ALTER TABLE `kategori`
  MODIFY `id_kategori` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `klaim`
--
ALTER TABLE `klaim`
  MODIFY `id_klaim` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `laporan_konten`
--
ALTER TABLE `laporan_konten`
  MODIFY `id_laporan` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `id_notifikasi` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `pesan`
--
ALTER TABLE `pesan`
  MODIFY `id_pesan` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `prodi`
--
ALTER TABLE `prodi`
  MODIFY `id_prodi` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `role`
--
ALTER TABLE `role`
  MODIFY `id_role` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `room_chat`
--
ALTER TABLE `room_chat`
  MODIFY `id_room` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id_user` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `user_device`
--
ALTER TABLE `user_device`
  MODIFY `id_device` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `barang`
--
ALTER TABLE `barang`
  ADD CONSTRAINT `fk_barang_kategori` FOREIGN KEY (`id_kategori`) REFERENCES `kategori` (`id_kategori`),
  ADD CONSTRAINT `fk_barang_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `foto_barang`
--
ALTER TABLE `foto_barang`
  ADD CONSTRAINT `fk_foto_barang` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id_barang`) ON DELETE CASCADE;

--
-- Constraints for table `kategori`
--
ALTER TABLE `kategori`
  ADD CONSTRAINT `fk_kategori_user` FOREIGN KEY (`id_user_pembuat`) REFERENCES `user` (`id_user`) ON DELETE SET NULL;

--
-- Constraints for table `klaim`
--
ALTER TABLE `klaim`
  ADD CONSTRAINT `fk_klaim_barang` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id_barang`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_klaim_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `laporan_konten`
--
ALTER TABLE `laporan_konten`
  ADD CONSTRAINT `fk_lap_barang` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id_barang`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_lap_pelapor` FOREIGN KEY (`id_user_pelapor`) REFERENCES `user` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD CONSTRAINT `fk_notif_barang` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id_barang`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_notif_klaim` FOREIGN KEY (`id_klaim`) REFERENCES `klaim` (`id_klaim`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_notif_room` FOREIGN KEY (`id_room`) REFERENCES `room_chat` (`id_room`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_notif_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `pesan`
--
ALTER TABLE `pesan`
  ADD CONSTRAINT `fk_pesan_pengirim` FOREIGN KEY (`id_pengirim`) REFERENCES `user` (`id_user`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_pesan_room` FOREIGN KEY (`id_room`) REFERENCES `room_chat` (`id_room`) ON DELETE CASCADE;

--
-- Constraints for table `prodi`
--
ALTER TABLE `prodi`
  ADD CONSTRAINT `fk_prodi_fakultas` FOREIGN KEY (`id_fakultas`) REFERENCES `fakultas` (`id_fakultas`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `room_chat`
--
ALTER TABLE `room_chat`
  ADD CONSTRAINT `fk_room_barang` FOREIGN KEY (`id_barang`) REFERENCES `barang` (`id_barang`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_room_user1` FOREIGN KEY (`id_user1`) REFERENCES `user` (`id_user`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_room_user2` FOREIGN KEY (`id_user2`) REFERENCES `user` (`id_user`) ON DELETE CASCADE;

--
-- Constraints for table `user`
--
ALTER TABLE `user`
  ADD CONSTRAINT `fk_user_prodi` FOREIGN KEY (`id_prodi`) REFERENCES `prodi` (`id_prodi`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user_role` FOREIGN KEY (`id_role`) REFERENCES `role` (`id_role`) ON UPDATE CASCADE;

--
-- Constraints for table `user_device`
--
ALTER TABLE `user_device`
  ADD CONSTRAINT `fk_device_user` FOREIGN KEY (`id_user`) REFERENCES `user` (`id_user`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
