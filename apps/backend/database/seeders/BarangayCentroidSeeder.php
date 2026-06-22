<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class BarangayCentroidSeeder extends Seeder
{
    public function run(): void
    {
        // Representative barangays for Western Visayas (Region VI) — demo coverage area.
        // In production, replace with the full PSGC dataset (~42,000 barangays).
        $centroids = [
            // Iloilo City
            ['name' => 'City Proper', 'city_municipality' => 'Iloilo City', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.6969, 'longitude' => 122.5644],
            ['name' => 'Jaro', 'city_municipality' => 'Iloilo City', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.7202, 'longitude' => 122.5621],
            ['name' => 'Molo', 'city_municipality' => 'Iloilo City', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.6889, 'longitude' => 122.5494],
            ['name' => 'Mandurriao', 'city_municipality' => 'Iloilo City', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.7069, 'longitude' => 122.5367],
            ['name' => 'Lapuz', 'city_municipality' => 'Iloilo City', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.7003, 'longitude' => 122.5781],
            ['name' => 'Arevalo', 'city_municipality' => 'Iloilo City', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.6786, 'longitude' => 122.5194],
            ['name' => 'La Paz', 'city_municipality' => 'Iloilo City', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.7131, 'longitude' => 122.5669],

            // Guimaras (Jordan municipality — primary demo area)
            ['name' => 'Jordan', 'city_municipality' => 'Jordan', 'province' => 'Guimaras', 'region' => 'Western Visayas', 'latitude' => 10.6581, 'longitude' => 122.1928],
            ['name' => 'Rizal', 'city_municipality' => 'Jordan', 'province' => 'Guimaras', 'region' => 'Western Visayas', 'latitude' => 10.6494, 'longitude' => 122.1836],
            ['name' => 'San Miguel', 'city_municipality' => 'Jordan', 'province' => 'Guimaras', 'region' => 'Western Visayas', 'latitude' => 10.6714, 'longitude' => 122.2011],
            ['name' => 'Hoskyn', 'city_municipality' => 'Jordan', 'province' => 'Guimaras', 'region' => 'Western Visayas', 'latitude' => 10.6450, 'longitude' => 122.1753],
            ['name' => 'Barangay Poblacion', 'city_municipality' => 'Jordan', 'province' => 'Guimaras', 'region' => 'Western Visayas', 'latitude' => 10.6550, 'longitude' => 122.1900],

            // Buenavista, Guimaras
            ['name' => 'Buenavista', 'city_municipality' => 'Buenavista', 'province' => 'Guimaras', 'region' => 'Western Visayas', 'latitude' => 10.7044, 'longitude' => 122.6314],
            ['name' => 'Sta. Rosa', 'city_municipality' => 'Buenavista', 'province' => 'Guimaras', 'region' => 'Western Visayas', 'latitude' => 10.7100, 'longitude' => 122.6250],

            // Nueva Valencia, Guimaras
            ['name' => 'Nueva Valencia', 'city_municipality' => 'Nueva Valencia', 'province' => 'Guimaras', 'region' => 'Western Visayas', 'latitude' => 10.5275, 'longitude' => 122.5336],
            ['name' => 'La Paz', 'city_municipality' => 'Nueva Valencia', 'province' => 'Guimaras', 'region' => 'Western Visayas', 'latitude' => 10.5150, 'longitude' => 122.5200],

            // San Lorenzo, Guimaras
            ['name' => 'San Lorenzo', 'city_municipality' => 'San Lorenzo', 'province' => 'Guimaras', 'region' => 'Western Visayas', 'latitude' => 10.6047, 'longitude' => 122.7119],

            // Sibunag, Guimaras
            ['name' => 'Sibunag', 'city_municipality' => 'Sibunag', 'province' => 'Guimaras', 'region' => 'Western Visayas', 'latitude' => 10.5833, 'longitude' => 122.6167],

            // Iloilo Province (mainland)
            ['name' => 'Oton', 'city_municipality' => 'Oton', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.6931, 'longitude' => 122.4736],
            ['name' => 'Pavia', 'city_municipality' => 'Pavia', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.7750, 'longitude' => 122.5458],
            ['name' => 'Santa Barbara', 'city_municipality' => 'Santa Barbara', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.8231, 'longitude' => 122.5344],
            ['name' => 'Leganes', 'city_municipality' => 'Leganes', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.7833, 'longitude' => 122.5917],
            ['name' => 'Zarraga', 'city_municipality' => 'Zarraga', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.8167, 'longitude' => 122.6083],
            ['name' => 'Dumangas', 'city_municipality' => 'Dumangas', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.8333, 'longitude' => 122.7167],
            ['name' => 'Pototan', 'city_municipality' => 'Pototan', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.9500, 'longitude' => 122.6333],
            ['name' => 'Passi City', 'city_municipality' => 'Passi', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 11.1000, 'longitude' => 122.6333],
            ['name' => 'Miagao', 'city_municipality' => 'Miagao', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.6500, 'longitude' => 122.2333],
            ['name' => 'San Joaquin', 'city_municipality' => 'San Joaquin', 'province' => 'Iloilo', 'region' => 'Western Visayas', 'latitude' => 10.5833, 'longitude' => 122.1333],

            // Capiz
            ['name' => 'Roxas City', 'city_municipality' => 'Roxas City', 'province' => 'Capiz', 'region' => 'Western Visayas', 'latitude' => 11.5853, 'longitude' => 122.7511],
            ['name' => 'Panay', 'city_municipality' => 'Panay', 'province' => 'Capiz', 'region' => 'Western Visayas', 'latitude' => 11.5550, 'longitude' => 122.7833],

            // Antique
            ['name' => 'San Jose de Buenavista', 'city_municipality' => 'San Jose', 'province' => 'Antique', 'region' => 'Western Visayas', 'latitude' => 10.7469, 'longitude' => 121.9411],

            // Aklan
            ['name' => 'Kalibo', 'city_municipality' => 'Kalibo', 'province' => 'Aklan', 'region' => 'Western Visayas', 'latitude' => 11.7064, 'longitude' => 122.3667],
            ['name' => 'Malay', 'city_municipality' => 'Malay', 'province' => 'Aklan', 'region' => 'Western Visayas', 'latitude' => 11.8967, 'longitude' => 121.9028],

            // Negros Occidental
            ['name' => 'Bacolod City', 'city_municipality' => 'Bacolod', 'province' => 'Negros Occidental', 'region' => 'Western Visayas', 'latitude' => 10.6714, 'longitude' => 122.9511],
            ['name' => 'Talisay', 'city_municipality' => 'Talisay', 'province' => 'Negros Occidental', 'region' => 'Western Visayas', 'latitude' => 10.7375, 'longitude' => 122.9653],
            ['name' => 'Silay', 'city_municipality' => 'Silay', 'province' => 'Negros Occidental', 'region' => 'Western Visayas', 'latitude' => 10.7969, 'longitude' => 122.9742],
        ];

        $now = now();
        $rows = array_map(fn ($b) => array_merge($b, ['created_at' => $now, 'updated_at' => $now]), $centroids);

        DB::table('barangay_centroids')->insert($rows);
    }
}
