import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SocialLink {
    platform: string;
    url: string;
}

export interface SchoolSettings {
    // ข้อมูลทั่วไป
    school_name: string;
    school_tagline: string;
    school_description: string;
    school_vision: string;
    school_mission: string;
    school_values: string;
    school_history: string;

    // Hero Section
    hero_badge: string;
    hero_title_1: string;
    hero_title_2: string;

    // สถิติ (Hero)
    stat_students: string;
    stat_students_label: string;
    stat_university: string;
    stat_university_label: string;
    stat_years: string;
    stat_years_label: string;

    // Section Headers
    about_title_1: string;
    about_title_2: string;
    curriculum_title_1: string;
    curriculum_title_2: string;
    curriculum_description: string;
    curriculum_study_time: string;
    curriculum_class_size: string;
    curriculum_duration: string;
    curriculum_duration_label: string;

    // About Stats
    about_stat_1: string;
    about_stat_1_label: string;
    about_stat_2: string;
    about_stat_2_label: string;
    about_stat_3: string;
    about_stat_3_label: string;
    about_stat_4: string;
    about_stat_4_label: string;

    // ข้อมูลติดต่อ
    contact_address: string;
    contact_phone: string;
    contact_email: string;
    contact_fax: string;
    contact_hours: string;
    contact_map_url: string;
    google_maps_embed: string;

    // Social Media
    social_facebook: string;
    social_youtube: string;
    social_instagram: string;
    social_line: string;
    social_links: SocialLink[];

    // Footer Services
    footer_service_1_name: string;
    footer_service_1_url: string;
    footer_service_2_name: string;
    footer_service_2_url: string;
    footer_service_3_name: string;
    footer_service_3_url: string;
    footer_service_4_name: string;
    footer_service_4_url: string;
    academic_calendar_url: string;
    academic_year: string;
}

const defaultSettings: SchoolSettings = {
    school_name: 'โรงเรียนโสตศึกษาจังหวัดสงขลา',
    school_tagline: 'มุ่งมั่นพัฒนา เพื่อคุณภาพชีวิตที่ดีของผู้พิการทางการได้ยิน',
    school_description: 'โรงเรียนโสตศึกษาจังหวัดสงขลา เป็นสถานศึกษาสังกัดสำนักบริหารงานการศึกษาพิเศษ ให้การศึกษาแก่นักเรียนที่มีความบกพร่องทางการได้ยิน',
    school_vision: 'ผู้เรียนที่มีความบกพร่องทางการได้ยินได้รับการพัฒนาศักยภาพอย่างเต็มที่ มีคุณภาพชีวิตที่ดี อยู่ในสังคมได้อย่างมีความสุข',
    school_mission: 'จัดการศึกษาสำหรับผู้พิการทางการได้ยินอย่างมีคุณภาพ พัฒนาครูและบุคลากรให้มีความเชี่ยวชาญด้านการศึกษาพิเศษ ส่งเสริมการมีส่วนร่วมของชุมชนและผู้ปกครอง',
    school_values: 'มีวินัย ใส่ใจผู้เรียน พัฒนาตนเอง รับผิดชอบ',
    school_history: 'ก่อตั้งเมื่อปี พ.ศ. 2515 ให้บริการการศึกษาพิเศษสำหรับผู้พิการทางการได้ยินในภาคใต้',
    hero_badge: 'ระบบจัดการเอกสาร ปีการศึกษา 2568',
    hero_title_1: 'ระบบจัดการเอกสาร',
    hero_title_2: 'โรงเรียนโสตศึกษาจังหวัดสงขลา',
    stat_students: '200+',
    stat_students_label: 'นักเรียน',
    stat_university: '5',
    stat_university_label: 'ฝ่ายงาน',
    stat_years: '50+',
    stat_years_label: 'ปีแห่งการศึกษาพิเศษ',
    about_title_1: 'ระบบจัดการเอกสาร',
    about_title_2: 'ครบวงจร',
    curriculum_title_1: 'เอกสารงาน',
    curriculum_title_2: 'ทุกฝ่าย',
    curriculum_description: 'ระบบรวบรวมและจัดการเอกสารของทุกฝ่ายงานในโรงเรียน ตอบสนองงานประกันคุณภาพ PA SAR IEP และงานอื่นๆ',
    curriculum_study_time: '07:30 - 16:30',
    curriculum_class_size: '5-8 คน',
    curriculum_duration: 'ตลอดปี',
    curriculum_duration_label: 'การศึกษาพิเศษ',
    about_stat_1: '50+',
    about_stat_1_label: 'ปีที่ก่อตั้ง',
    about_stat_2: '200+',
    about_stat_2_label: 'นักเรียนปัจจุบัน',
    about_stat_3: '50+',
    about_stat_3_label: 'บุคลากรคุณภาพ',
    about_stat_4: '5',
    about_stat_4_label: 'ฝ่ายงานหลัก',
    contact_address: 'ถนนกาญจนวนิช ตำบลเขารูปช้าง อำเภอเมือง จังหวัดสงขลา 90000',
    contact_phone: '074-311-XXX',
    contact_email: 'sottsongkhla@special.ac.th',
    contact_fax: '074-311-XXX',
    contact_hours: 'จันทร์ - ศุกร์ 07:30 - 16:30 น.',
    contact_map_url: '',
    google_maps_embed: '',
    social_facebook: '',
    social_youtube: '',
    social_instagram: '',
    social_line: '',
    footer_service_1_name: 'ระบบเอกสาร',
    footer_service_1_url: '/documents',
    footer_service_2_name: 'บันทึกเวร',
    footer_service_2_url: '/admin/dashboard?tab=duty',
    footer_service_3_name: 'ใบลา',
    footer_service_3_url: '/admin/dashboard?tab=leave',
    footer_service_4_name: 'แจ้งซ่อม',
    footer_service_4_url: '/admin/dashboard?tab=maintenance',
    academic_calendar_url: '',
    academic_year: '2568',
    social_links: [],
};

const CACHE_KEY = 'school_settings_cache';

// Function to get cached settings from localStorage
const getCachedSettings = (): SchoolSettings | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
    } catch (error) {
        console.error('Error reading cached settings:', error);
    }
    return null;
};

// Function to save settings to localStorage
const saveCacheSettings = (settings: SchoolSettings) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Error caching settings:', error);
    }
};

export const useSchoolSettings = () => {
    // Initialize with cached settings or defaults
    const [settings, setSettings] = useState<SchoolSettings>(() => {
        const cached = getCachedSettings();
        return cached || defaultSettings;
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('school_settings')
                .select('key, value');

            if (error) throw error;

            if (data) {
                const settingsMap: Record<string, string> = {};
                data.forEach((setting: any) => {
                    settingsMap[setting.key] = setting.value || '';
                });

                const newSettings: SchoolSettings = {
                    school_name: settingsMap.school_name || defaultSettings.school_name,
                    school_tagline: settingsMap.school_tagline || defaultSettings.school_tagline,
                    school_description: settingsMap.school_description || defaultSettings.school_description,
                    school_vision: settingsMap.school_vision || defaultSettings.school_vision,
                    school_mission: settingsMap.school_mission || defaultSettings.school_mission,
                    school_values: settingsMap.school_values || defaultSettings.school_values,
                    school_history: settingsMap.school_history || defaultSettings.school_history,
                    hero_badge: settingsMap.hero_badge || defaultSettings.hero_badge,
                    hero_title_1: settingsMap.hero_title_1 || defaultSettings.hero_title_1,
                    hero_title_2: settingsMap.hero_title_2 || defaultSettings.hero_title_2,
                    stat_students: settingsMap.stat_students || defaultSettings.stat_students,
                    stat_students_label: settingsMap.stat_students_label || defaultSettings.stat_students_label,
                    stat_university: settingsMap.stat_university || defaultSettings.stat_university,
                    stat_university_label: settingsMap.stat_university_label || defaultSettings.stat_university_label,
                    stat_years: settingsMap.stat_years || defaultSettings.stat_years,
                    stat_years_label: settingsMap.stat_years_label || defaultSettings.stat_years_label,
                    about_title_1: settingsMap.about_title_1 || defaultSettings.about_title_1,
                    about_title_2: settingsMap.about_title_2 || defaultSettings.about_title_2,
                    curriculum_title_1: settingsMap.curriculum_title_1 || defaultSettings.curriculum_title_1,
                    curriculum_title_2: settingsMap.curriculum_title_2 || defaultSettings.curriculum_title_2,
                    curriculum_description: settingsMap.curriculum_description || defaultSettings.curriculum_description,
                    curriculum_study_time: settingsMap.curriculum_study_time || defaultSettings.curriculum_study_time,
                    curriculum_class_size: settingsMap.curriculum_class_size || defaultSettings.curriculum_class_size,
                    curriculum_duration: settingsMap.curriculum_duration || defaultSettings.curriculum_duration,
                    curriculum_duration_label: settingsMap.curriculum_duration_label || defaultSettings.curriculum_duration_label,
                    about_stat_1: settingsMap.about_stat_1 || defaultSettings.about_stat_1,
                    about_stat_1_label: settingsMap.about_stat_1_label || defaultSettings.about_stat_1_label,
                    about_stat_2: settingsMap.about_stat_2 || defaultSettings.about_stat_2,
                    about_stat_2_label: settingsMap.about_stat_2_label || defaultSettings.about_stat_2_label,
                    about_stat_3: settingsMap.about_stat_3 || defaultSettings.about_stat_3,
                    about_stat_3_label: settingsMap.about_stat_3_label || defaultSettings.about_stat_3_label,
                    about_stat_4: settingsMap.about_stat_4 || defaultSettings.about_stat_4,
                    about_stat_4_label: settingsMap.about_stat_4_label || defaultSettings.about_stat_4_label,
                    contact_address: settingsMap.contact_address || defaultSettings.contact_address,
                    contact_phone: settingsMap.contact_phone || defaultSettings.contact_phone,
                    contact_email: settingsMap.contact_email || defaultSettings.contact_email,
                    contact_fax: settingsMap.contact_fax || '',
                    contact_hours: settingsMap.contact_hours || defaultSettings.contact_hours,
                    contact_map_url: settingsMap.contact_map_url || '',
                    google_maps_embed: settingsMap.google_maps_embed || '',
                    social_facebook: settingsMap.social_facebook || '',
                    social_youtube: settingsMap.social_youtube || '',
                    social_instagram: settingsMap.social_instagram || '',
                    social_line: settingsMap.social_line || '',
                    footer_service_1_name: settingsMap.footer_service_1_name || defaultSettings.footer_service_1_name,
                    footer_service_1_url: settingsMap.footer_service_1_url || defaultSettings.footer_service_1_url,
                    footer_service_2_name: settingsMap.footer_service_2_name || defaultSettings.footer_service_2_name,
                    footer_service_2_url: settingsMap.footer_service_2_url || defaultSettings.footer_service_2_url,
                    footer_service_3_name: settingsMap.footer_service_3_name || defaultSettings.footer_service_3_name,
                    footer_service_3_url: settingsMap.footer_service_3_url || defaultSettings.footer_service_3_url,
                    footer_service_4_name: settingsMap.footer_service_4_name || defaultSettings.footer_service_4_name,
                    footer_service_4_url: settingsMap.footer_service_4_url || defaultSettings.footer_service_4_url,
                    academic_calendar_url: settingsMap.academic_calendar_url || defaultSettings.academic_calendar_url,
                    academic_year: settingsMap.academic_year || defaultSettings.academic_year,
                    social_links: settingsMap.social_links ? JSON.parse(settingsMap.social_links) : defaultSettings.social_links,
                };

                setSettings(newSettings);
                // Cache the new settings
                saveCacheSettings(newSettings);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    return { settings, loading, refetch: fetchSettings };
};
