<?php

namespace Database\Seeders;

use App\Models\CountryCode;
use Illuminate\Database\Seeder;

class CountryCodeSeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            ['alpha2_code' => 'BN', 'numeric_code' => '096', 'country_name' => 'Brunei', 'currency_code' => 'BND', 'currency_name' => 'Brunei Dollar', 'eco_credit_rate' => 0.1350],
            ['alpha2_code' => 'KH', 'numeric_code' => '116', 'country_name' => 'Cambodia', 'currency_code' => 'KHR', 'currency_name' => 'Cambodian Riel', 'eco_credit_rate' => 410.0000],
            ['alpha2_code' => 'ID', 'numeric_code' => '360', 'country_name' => 'Indonesia', 'currency_code' => 'IDR', 'currency_name' => 'Indonesian Rupiah', 'eco_credit_rate' => 1600.0000],
            ['alpha2_code' => 'LA', 'numeric_code' => '418', 'country_name' => 'Laos', 'currency_code' => 'LAK', 'currency_name' => 'Lao Kip', 'eco_credit_rate' => 2200.0000],
            ['alpha2_code' => 'MY', 'numeric_code' => '458', 'country_name' => 'Malaysia', 'currency_code' => 'MYR', 'currency_name' => 'Malaysian Ringgit', 'eco_credit_rate' => 0.4500],
            ['alpha2_code' => 'MM', 'numeric_code' => '104', 'country_name' => 'Myanmar', 'currency_code' => 'MMK', 'currency_name' => 'Myanmar Kyat', 'eco_credit_rate' => 210.0000],
            ['alpha2_code' => 'PH', 'numeric_code' => '608', 'country_name' => 'Philippines', 'currency_code' => 'PHP', 'currency_name' => 'Philippine Peso', 'eco_credit_rate' => 5.0000],
            ['alpha2_code' => 'SG', 'numeric_code' => '702', 'country_name' => 'Singapore', 'currency_code' => 'SGD', 'currency_name' => 'Singapore Dollar', 'eco_credit_rate' => 0.1350],
            ['alpha2_code' => 'TH', 'numeric_code' => '764', 'country_name' => 'Thailand', 'currency_code' => 'THB', 'currency_name' => 'Thai Baht', 'eco_credit_rate' => 3.5000],
            ['alpha2_code' => 'VN', 'numeric_code' => '704', 'country_name' => 'Vietnam', 'currency_code' => 'VND', 'currency_name' => 'Vietnamese Dong', 'eco_credit_rate' => 2500.0000],
        ];

        foreach ($countries as $data) {
            CountryCode::firstOrCreate(
                ['alpha2_code' => $data['alpha2_code']],
                $data
            );
        }
    }
}
