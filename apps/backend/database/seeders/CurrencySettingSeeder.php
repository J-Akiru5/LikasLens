<?php

namespace Database\Seeders;

use App\Models\CurrencySetting;
use Illuminate\Database\Seeder;

class CurrencySettingSeeder extends Seeder
{
    public function run(): void
    {
        $countries = [
            ['country_code' => 'PH', 'country_name' => 'Philippines', 'currency_code' => 'PHP', 'currency_name' => 'Philippine Peso', 'eco_credit_rate' => 5.0000],
            ['country_code' => 'ID', 'country_name' => 'Indonesia', 'currency_code' => 'IDR', 'currency_name' => 'Indonesian Rupiah', 'eco_credit_rate' => 1600.0000],
            ['country_code' => 'MY', 'country_name' => 'Malaysia', 'currency_code' => 'MYR', 'currency_name' => 'Malaysian Ringgit', 'eco_credit_rate' => 0.4500],
            ['country_code' => 'TH', 'country_name' => 'Thailand', 'currency_code' => 'THB', 'currency_name' => 'Thai Baht', 'eco_credit_rate' => 3.5000],
            ['country_code' => 'VN', 'country_name' => 'Vietnam', 'currency_code' => 'VND', 'currency_name' => 'Vietnamese Dong', 'eco_credit_rate' => 2500.0000],
            ['country_code' => 'SG', 'country_name' => 'Singapore', 'currency_code' => 'SGD', 'currency_name' => 'Singapore Dollar', 'eco_credit_rate' => 0.1350],
            ['country_code' => 'BN', 'country_name' => 'Brunei', 'currency_code' => 'BND', 'currency_name' => 'Brunei Dollar', 'eco_credit_rate' => 0.1350],
            ['country_code' => 'LA', 'country_name' => 'Laos', 'currency_code' => 'LAK', 'currency_name' => 'Lao Kip', 'eco_credit_rate' => 2200.0000],
            ['country_code' => 'KH', 'country_name' => 'Cambodia', 'currency_code' => 'KHR', 'currency_name' => 'Cambodian Riel', 'eco_credit_rate' => 410.0000],
            ['country_code' => 'MM', 'country_name' => 'Myanmar', 'currency_code' => 'MMK', 'currency_name' => 'Myanmar Kyat', 'eco_credit_rate' => 210.0000],
        ];

        foreach ($countries as $data) {
            CurrencySetting::create($data);
        }
    }
}
