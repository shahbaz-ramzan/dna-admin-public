export enum TourStatus {
    // Don't show if user dismissed or completed
    Dismissed = 0,
    Completed = 1,
    // show
    InProgress = 2,
    Skipped = 3,
}

export enum TourKey {
    Dashboard = 'Dashboard_Tour',
    DigitalScan = 'DigitalScan_Tour',
}

export enum BannerKey {
    DigitalScanBanner = 'Digital_Scan',
    OpenHoursBanner = 'Open_hours_23rd_october_2025',
}

export enum BannerStatus {
    Dismissed = 0,
    Completed = 1,
}
