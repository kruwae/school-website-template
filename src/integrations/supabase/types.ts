export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            admissions: {
                Row: {
                    id: string
                    student_name: string
                    student_id_card: string | null
                    birth_date: string | null
                    gender: string | null
                    parent_name: string
                    parent_phone: string
                    parent_email: string | null
                    address: string | null
                    previous_school: string | null
                    grade_applying: string
                    program_applying: string
                    status: string
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    student_name: string
                    student_id_card?: string | null
                    birth_date?: string | null
                    gender?: string | null
                    parent_name: string
                    parent_phone: string
                    parent_email?: string | null
                    address?: string | null
                    previous_school?: string | null
                    grade_applying: string
                    program_applying: string
                    status?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    student_name?: string
                    student_id_card?: string | null
                    birth_date?: string | null
                    gender?: string | null
                    parent_name?: string
                    parent_phone?: string
                    parent_email?: string | null
                    address?: string | null
                    previous_school?: string | null
                    grade_applying?: string
                    program_applying?: string
                    status?: string
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            curriculum_programs: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    icon: string | null
                    color: string | null
                    subjects: string[] | null
                    careers: string[] | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    icon?: string | null
                    color?: string | null
                    subjects?: string[] | null
                    careers?: string[] | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    icon?: string | null
                    color?: string | null
                    subjects?: string[] | null
                    careers?: string[] | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            curriculum_activities: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    icon: string | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    icon?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    icon?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            faq: {
                Row: {
                    id: string
                    question: string
                    answer: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    question: string
                    answer: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    question?: string
                    answer?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            milestones: {
                Row: {
                    id: string
                    year: string
                    event: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    year: string
                    event: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    year?: string
                    event?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            facilities: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    icon: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string
                    icon?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string
                    icon?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            administrators: {
                Row: {
                    id: string
                    name: string
                    position: string
                    education: string | null
                    quote: string | null
                    photo_url: string | null
                    order_position: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    position: string
                    education?: string | null
                    quote?: string | null
                    photo_url?: string | null
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    position?: string
                    education?: string | null
                    quote?: string | null
                    photo_url?: string | null
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            albums: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    cover_image: string | null
                    date: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    cover_image?: string | null
                    date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    cover_image?: string | null
                    date?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            events: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    start_date: string
                    end_date: string | null
                    event_type: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    start_date: string
                    end_date?: string | null
                    event_type?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    start_date?: string
                    end_date?: string | null
                    event_type?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            news: {
                Row: {
                    id: string
                    title: string
                    content: string
                    excerpt: string | null
                    image_url: string | null
                    category: string
                    published: boolean
                    published_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    content: string
                    excerpt?: string | null
                    image_url?: string | null
                    category?: string
                    published?: boolean
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    content?: string
                    excerpt?: string | null
                    image_url?: string | null
                    category?: string
                    published?: boolean
                    published_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            photos: {
                Row: {
                    id: string
                    album_id: string
                    image_url: string
                    caption: string | null
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    album_id: string
                    image_url: string
                    caption?: string | null
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    album_id?: string
                    image_url?: string
                    caption?: string | null
                    order_position?: number
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "photos_album_id_fkey"
                        columns: ["album_id"]
                        isOneToOne: false
                        referencedRelation: "albums"
                        referencedColumns: ["id"]
                    }
                ]
            }
            school_settings: {
                Row: {
                    id: string
                    school_name: string | null
                    school_name_en: string | null
                    slogan: string | null
                    address: string | null
                    phone: string | null
                    email: string | null
                    website: string | null
                    facebook: string | null
                    line_id: string | null
                    vision: string | null
                    mission: string | null
                    logo_url: string | null
                    hero_image_url: string | null
                    about_text: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    school_name?: string | null
                    school_name_en?: string | null
                    slogan?: string | null
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    website?: string | null
                    facebook?: string | null
                    line_id?: string | null
                    vision?: string | null
                    mission?: string | null
                    logo_url?: string | null
                    hero_image_url?: string | null
                    about_text?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    school_name?: string | null
                    school_name_en?: string | null
                    slogan?: string | null
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    website?: string | null
                    facebook?: string | null
                    line_id?: string | null
                    vision?: string | null
                    mission?: string | null
                    logo_url?: string | null
                    hero_image_url?: string | null
                    about_text?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            staff: {
                Row: {
                    id: string
                    name: string
                    position: string
                    department: string | null
                    subject: string | null
                    education: string | null
                    experience: string | null
                    photo_url: string | null
                    staff_type: string
                    order_position: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    position: string
                    department?: string | null
                    subject?: string | null
                    education?: string | null
                    experience?: string | null
                    photo_url?: string | null
                    staff_type?: string
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    position?: string
                    department?: string | null
                    subject?: string | null
                    education?: string | null
                    experience?: string | null
                    photo_url?: string | null
                    staff_type?: string
                    order_position?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            student_achievements: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    year: string | null
                    category: string | null
                    icon: string | null
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    year?: string | null
                    category?: string | null
                    icon?: string | null
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    year?: string | null
                    category?: string | null
                    icon?: string | null
                    order_position?: number
                    created_at?: string
                }
                Relationships: []
            }
            student_activities: {
                Row: {
                    id: string
                    name: string
                    members: number
                    description: string | null
                    order_position: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    members?: number
                    description?: string | null
                    order_position?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    members?: number
                    description?: string | null
                    order_position?: number
                    created_at?: string
                }
                Relationships: []
            }
            student_stats: {
                Row: {
                    id: string
                    label: string
                    value: string
                    icon: string
                    color: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    label: string
                    value: string
                    icon?: string
                    color?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    label?: string
                    value?: string
                    icon?: string
                    color?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            grade_data: {
                Row: {
                    id: string
                    level: string
                    rooms: number
                    students: number
                    boys: number
                    girls: number
                    order_position: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    level: string
                    rooms?: number
                    students?: number
                    boys?: number
                    girls?: number
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    level?: string
                    rooms?: number
                    students?: number
                    boys?: number
                    girls?: number
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            student_council: {
                Row: {
                    id: string
                    name: string
                    position: string
                    class: string | null
                    initial: string | null
                    image_url: string | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    position: string
                    class?: string
                    initial?: string
                    image_url?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    position?: string
                    class?: string
                    initial?: string
                    image_url?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: []
            }
            app_users: {
                Row: {
                    id: string
                    username: string
                    full_name: string
                    email: string | null
                    password_hash: string
                    role: string
                    staff_id: string | null
                    is_active: boolean
                    last_login_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    username: string
                    full_name: string
                    email?: string | null
                    password_hash: string
                    role?: string
                    staff_id?: string | null
                    is_active?: boolean
                    last_login_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    username?: string
                    full_name?: string
                    email?: string | null
                    password_hash?: string
                    role?: string
                    staff_id?: string | null
                    is_active?: boolean
                    last_login_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            departments: {
                Row: {
                    id: string
                    name: string
                    code: string
                    color: string
                    icon: string
                    description: string | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    code: string
                    color?: string
                    icon?: string
                    description?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    code?: string
                    color?: string
                    icon?: string
                    description?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            document_categories: {
                Row: {
                    id: string
                    department_id: string | null
                    name: string
                    code: string
                    description: string | null
                    order_position: number
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    department_id?: string | null
                    name: string
                    code: string
                    description?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    department_id?: string | null
                    name?: string
                    code?: string
                    description?: string | null
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "document_categories_department_id_fkey"
                        columns: ["department_id"]
                        isOneToOne: false
                        referencedRelation: "departments"
                        referencedColumns: ["id"]
                    }
                ]
            }
            documents: {
                Row: {
                    id: string
                    title: string
                    department_id: string | null
                    category_id: string | null
                    academic_year: string
                    semester: string
                    document_type: string
                    status: string
                    file_url: string | null
                    file_name: string | null
                    file_type: string | null
                    file_size: number | null
                    uploader_name: string | null
                    uploader_id: string | null
                    description: string | null
                    notes: string | null
                    tags: string[] | null
                    is_public: boolean
                    view_count: number
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    department_id?: string | null
                    category_id?: string | null
                    academic_year?: string
                    semester?: string
                    document_type?: string
                    status?: string
                    file_url?: string | null
                    file_name?: string | null
                    file_type?: string | null
                    file_size?: number | null
                    uploader_name?: string | null
                    uploader_id?: string | null
                    description?: string | null
                    notes?: string | null
                    tags?: string[] | null
                    is_public?: boolean
                    view_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    department_id?: string | null
                    category_id?: string | null
                    academic_year?: string
                    semester?: string
                    document_type?: string
                    status?: string
                    file_url?: string | null
                    file_name?: string | null
                    file_type?: string | null
                    file_size?: number | null
                    uploader_name?: string | null
                    uploader_id?: string | null
                    description?: string | null
                    notes?: string | null
                    tags?: string[] | null
                    is_public?: boolean
                    view_count?: number
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "documents_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "document_categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "documents_department_id_fkey"
                        columns: ["department_id"]
                        isOneToOne: false
                        referencedRelation: "departments"
                        referencedColumns: ["id"]
                    }
                ]
            }
            duty_records: {
                Row: {
                    id: string
                    duty_date: string
                    duty_shift: string
                    duty_shift_label: string | null
                    recorder_name: string
                    recorder_position: string | null
                    start_time: string | null
                    end_time: string | null
                    students_present: number
                    students_absent: number
                    incidents: string | null
                    actions_taken: string | null
                    remarks: string | null
                    status: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    duty_date: string
                    duty_shift?: string
                    duty_shift_label?: string | null
                    recorder_name: string
                    recorder_position?: string | null
                    start_time?: string | null
                    end_time?: string | null
                    students_present?: number
                    students_absent?: number
                    incidents?: string | null
                    actions_taken?: string | null
                    remarks?: string | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    duty_date?: string
                    duty_shift?: string
                    duty_shift_label?: string | null
                    recorder_name?: string
                    recorder_position?: string | null
                    start_time?: string | null
                    end_time?: string | null
                    students_present?: number
                    students_absent?: number
                    incidents?: string | null
                    actions_taken?: string | null
                    remarks?: string | null
                    status?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            leave_requests: {
                Row: {
                    id: string
                    requester_name: string
                    requester_position: string | null
                    department_id: string | null
                    leave_type: string
                    leave_type_label: string | null
                    start_date: string
                    end_date: string
                    total_days: number | null
                    reason: string
                    contact_during_leave: string | null
                    substitute_name: string | null
                    status: string
                    approved_by: string | null
                    approved_at: string | null
                    rejection_reason: string | null
                    document_url: string | null
                    academic_year: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    requester_name: string
                    requester_position?: string | null
                    department_id?: string | null
                    leave_type: string
                    leave_type_label?: string | null
                    start_date: string
                    end_date: string
                    total_days?: number | null
                    reason: string
                    contact_during_leave?: string | null
                    substitute_name?: string | null
                    status?: string
                    approved_by?: string | null
                    approved_at?: string | null
                    rejection_reason?: string | null
                    document_url?: string | null
                    academic_year?: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    requester_name?: string
                    requester_position?: string | null
                    department_id?: string | null
                    leave_type?: string
                    leave_type_label?: string | null
                    start_date?: string
                    end_date?: string
                    total_days?: number | null
                    reason?: string
                    contact_during_leave?: string | null
                    substitute_name?: string | null
                    status?: string
                    approved_by?: string | null
                    approved_at?: string | null
                    rejection_reason?: string | null
                    document_url?: string | null
                    academic_year?: string
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "leave_requests_department_id_fkey"
                        columns: ["department_id"]
                        isOneToOne: false
                        referencedRelation: "departments"
                        referencedColumns: ["id"]
                    }
                ]
            }
            maintenance_requests: {
                Row: {
                    id: string
                    title: string
                    location: string | null
                    room_number: string | null
                    description: string
                    priority: string
                    status: string
                    reported_by: string
                    reporter_phone: string | null
                    assigned_to: string | null
                    estimated_cost: number | null
                    actual_cost: number | null
                    started_at: string | null
                    completed_at: string | null
                    image_url: string | null
                    completion_notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    location?: string | null
                    room_number?: string | null
                    description: string
                    priority?: string
                    status?: string
                    reported_by: string
                    reporter_phone?: string | null
                    assigned_to?: string | null
                    estimated_cost?: number | null
                    actual_cost?: number | null
                    started_at?: string | null
                    completed_at?: string | null
                    image_url?: string | null
                    completion_notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    location?: string | null
                    room_number?: string | null
                    description?: string
                    priority?: string
                    status?: string
                    reported_by?: string
                    reporter_phone?: string | null
                    assigned_to?: string | null
                    estimated_cost?: number | null
                    actual_cost?: number | null
                    started_at?: string | null
                    completed_at?: string | null
                    image_url?: string | null
                    completion_notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            audit_evaluatees: {
                Row: {
                    id: string
                    name: string
                    position: string
                    position_type: string
                    department_id: string | null
                    user_id: string | null
                    academic_year: string
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    position: string
                    position_type?: string
                    department_id?: string | null
                    user_id?: string | null
                    academic_year?: string
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    position?: string
                    position_type?: string
                    department_id?: string | null
                    user_id?: string | null
                    academic_year?: string
                    is_active?: boolean
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_evaluatees_department_id_fkey"
                        columns: ["department_id"]
                        isOneToOne: false
                        referencedRelation: "departments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "audit_evaluatees_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "app_users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            audit_committees: {
                Row: {
                    id: string
                    name: string
                    role: string
                    role_label: string | null
                    weight_percent: number
                    academic_year: string
                    order_position: number
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    role: string
                    role_label?: string | null
                    weight_percent?: number
                    academic_year?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    role?: string
                    role_label?: string | null
                    weight_percent?: number
                    academic_year?: string
                    order_position?: number
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            audit_evaluations: {
                Row: {
                    id: string
                    evaluatee_id: string
                    committee_id: string
                    academic_year: string
                    score_1_1: number
                    score_1_2: number
                    score_2_1: number
                    score_2_2: number
                    score_3_1: number
                    score_3_2: number
                    score_3_3: number
                    score_3_4: number
                    score_3_5: number
                    score_3_6: number
                    score_3_7: number
                    score_3_8: number
                    remarks: string | null
                    is_submitted: boolean
                    submitted_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    evaluatee_id: string
                    committee_id: string
                    academic_year?: string
                    score_1_1?: number
                    score_1_2?: number
                    score_2_1?: number
                    score_2_2?: number
                    score_3_1?: number
                    score_3_2?: number
                    score_3_3?: number
                    score_3_4?: number
                    score_3_5?: number
                    score_3_6?: number
                    score_3_7?: number
                    score_3_8?: number
                    remarks?: string | null
                    is_submitted?: boolean
                    submitted_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    evaluatee_id?: string
                    committee_id?: string
                    academic_year?: string
                    score_1_1?: number
                    score_1_2?: number
                    score_2_1?: number
                    score_2_2?: number
                    score_3_1?: number
                    score_3_2?: number
                    score_3_3?: number
                    score_3_4?: number
                    score_3_5?: number
                    score_3_6?: number
                    score_3_7?: number
                    score_3_8?: number
                    remarks?: string | null
                    is_submitted?: boolean
                    submitted_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "audit_evaluations_committee_id_fkey"
                        columns: ["committee_id"]
                        isOneToOne: false
                        referencedRelation: "audit_committees"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "audit_evaluations_evaluatee_id_fkey"
                        columns: ["evaluatee_id"]
                        isOneToOne: false
                        referencedRelation: "audit_evaluatees"
                        referencedColumns: ["id"]
                    }
                ]
            }
            projects: {
                Row: {
                    id: string
                    title: string
                    description: string | null
                    project_type: string
                    project_type_label: string | null
                    budget_source: string | null
                    budget_amount: number | null
                    budget_used: number
                    status: string
                    status_label: string | null
                    start_date: string | null
                    end_date: string | null
                    responsible_person_id: string | null
                    responsible_person_name: string | null
                    department_id: string | null
                    academic_year: string
                    semester: string
                    objectives: string[] | null
                    expected_outcomes: string | null
                    actual_outcomes: string | null
                    challenges: string | null
                    lessons_learned: string | null
                    created_by_id: string | null
                    created_by_name: string | null
                    approved_by_id: string | null
                    approved_by_name: string | null
                    approved_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    title: string
                    description?: string | null
                    project_type?: string
                    project_type_label?: string | null
                    budget_source?: string | null
                    budget_amount?: number | null
                    budget_used?: number
                    status?: string
                    status_label?: string | null
                    start_date?: string | null
                    end_date?: string | null
                    responsible_person_id?: string | null
                    responsible_person_name?: string | null
                    department_id?: string | null
                    academic_year?: string
                    semester?: string
                    objectives?: string[] | null
                    expected_outcomes?: string | null
                    actual_outcomes?: string | null
                    challenges?: string | null
                    lessons_learned?: string | null
                    created_by_id?: string | null
                    created_by_name?: string | null
                    approved_by_id?: string | null
                    approved_by_name?: string | null
                    approved_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    title?: string
                    description?: string | null
                    project_type?: string
                    project_type_label?: string | null
                    budget_source?: string | null
                    budget_amount?: number | null
                    budget_used?: number
                    status?: string
                    status_label?: string | null
                    start_date?: string | null
                    end_date?: string | null
                    responsible_person_id?: string | null
                    responsible_person_name?: string | null
                    department_id?: string | null
                    academic_year?: string
                    semester?: string
                    objectives?: string[] | null
                    expected_outcomes?: string | null
                    actual_outcomes?: string | null
                    challenges?: string | null
                    lessons_learned?: string | null
                    created_by_id?: string | null
                    created_by_name?: string | null
                    approved_by_id?: string | null
                    approved_by_name?: string | null
                    approved_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "projects_approved_by_id_fkey"
                        columns: ["approved_by_id"]
                        isOneToOne: false
                        referencedRelation: "app_users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "projects_created_by_id_fkey"
                        columns: ["created_by_id"]
                        isOneToOne: false
                        referencedRelation: "app_users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "projects_department_id_fkey"
                        columns: ["department_id"]
                        isOneToOne: false
                        referencedRelation: "departments"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "projects_responsible_person_id_fkey"
                        columns: ["responsible_person_id"]
                        isOneToOne: false
                        referencedRelation: "app_users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            project_documents: {
                Row: {
                    id: string
                    project_id: string
                    document_id: string | null
                    document_type: string
                    document_type_label: string | null
                    is_required: boolean
                    status: string
                    submitted_at: string | null
                    approved_at: string | null
                    approved_by_id: string | null
                    approved_by_name: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    document_id?: string | null
                    document_type?: string
                    document_type_label?: string | null
                    is_required?: boolean
                    status?: string
                    submitted_at?: string | null
                    approved_at?: string | null
                    approved_by_id?: string | null
                    approved_by_name?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    document_id?: string | null
                    document_type?: string
                    document_type_label?: string | null
                    is_required?: boolean
                    status?: string
                    submitted_at?: string | null
                    approved_at?: string | null
                    approved_by_id?: string | null
                    approved_by_name?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "project_documents_approved_by_id_fkey"
                        columns: ["approved_by_id"]
                        isOneToOne: false
                        referencedRelation: "app_users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_documents_document_id_fkey"
                        columns: ["document_id"]
                        isOneToOne: false
                        referencedRelation: "documents"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_documents_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
            project_budget_requests: {
                Row: {
                    id: string
                    project_id: string
                    request_amount: number
                    request_reason: string
                    request_date: string
                    requested_by_id: string | null
                    requested_by_name: string | null
                    approved_amount: number | null
                    approved_by_id: string | null
                    approved_by_name: string | null
                    approved_at: string | null
                    status: string
                    status_label: string | null
                    payment_date: string | null
                    receipt_document_id: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    request_amount: number
                    request_reason: string
                    request_date?: string
                    requested_by_id?: string | null
                    requested_by_name?: string | null
                    approved_amount?: number | null
                    approved_by_id?: string | null
                    approved_by_name?: string | null
                    approved_at?: string | null
                    status?: string
                    status_label?: string | null
                    payment_date?: string | null
                    receipt_document_id?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    request_amount?: number
                    request_reason?: string
                    request_date?: string
                    requested_by_id?: string | null
                    requested_by_name?: string | null
                    approved_amount?: number | null
                    approved_by_id?: string | null
                    approved_by_name?: string | null
                    approved_at?: string | null
                    status?: string
                    status_label?: string | null
                    payment_date?: string | null
                    receipt_document_id?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "project_budget_requests_approved_by_id_fkey"
                        columns: ["approved_by_id"]
                        isOneToOne: false
                        referencedRelation: "app_users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_budget_requests_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_budget_requests_receipt_document_id_fkey"
                        columns: ["receipt_document_id"]
                        isOneToOne: false
                        referencedRelation: "documents"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_budget_requests_requested_by_id_fkey"
                        columns: ["requested_by_id"]
                        isOneToOne: false
                        referencedRelation: "app_users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            project_team_members: {
                Row: {
                    id: string
                    project_id: string
                    user_id: string | null
                    user_name: string | null
                    role: string
                    role_label: string | null
                    responsibilities: string | null
                    joined_at: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    user_id?: string | null
                    user_name?: string | null
                    role?: string
                    role_label?: string | null
                    responsibilities?: string | null
                    joined_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    user_id?: string | null
                    user_name?: string | null
                    role?: string
                    role_label?: string | null
                    responsibilities?: string | null
                    joined_at?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "project_team_members_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_team_members_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "app_users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            budget_categories: {
                Row: {
                    id: string
                    name: string
                    code: string
                    description: string | null
                    is_active: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    code: string
                    description?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    code?: string
                    description?: string | null
                    is_active?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Relationships: []
            }
            project_budget_items: {
                Row: {
                    id: string
                    project_id: string
                    category_id: string
                    item_name: string
                    planned_amount: number
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    category_id: string
                    item_name: string
                    planned_amount?: number
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    category_id?: string
                    item_name?: string
                    planned_amount?: number
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "project_budget_items_category_id_fkey"
                        columns: ["category_id"]
                        isOneToOne: false
                        referencedRelation: "budget_categories"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "project_budget_items_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
            budget_transactions: {
                Row: {
                    id: string
                    project_id: string
                    budget_item_id: string | null
                    amount: number
                    transaction_type: string
                    description: string
                    transaction_date: string
                    created_by: string | null
                    document_id: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    project_id: string
                    budget_item_id?: string | null
                    amount: number
                    transaction_type?: string
                    description: string
                    transaction_date?: string
                    created_by?: string | null
                    document_id?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    project_id?: string
                    budget_item_id?: string | null
                    amount?: number
                    transaction_type?: string
                    description?: string
                    transaction_date?: string
                    created_by?: string | null
                    document_id?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "budget_transactions_budget_item_id_fkey"
                        columns: ["budget_item_id"]
                        isOneToOne: false
                        referencedRelation: "project_budget_items"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "budget_transactions_created_by_fkey"
                        columns: ["created_by"]
                        isOneToOne: false
                        referencedRelation: "app_users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "budget_transactions_document_id_fkey"
                        columns: ["document_id"]
                        isOneToOne: false
                        referencedRelation: "documents"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "budget_transactions_project_id_fkey"
                        columns: ["project_id"]
                        isOneToOne: false
                        referencedRelation: "projects"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof Database
    }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
    ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never