-- Create Issues table for issue reporting system
CREATE TABLE issues (
    issue_id INT IDENTITY(1,1) PRIMARY KEY,
    station_id INT NOT NULL,
    post_id INT NULL,
    title NVARCHAR(500) NOT NULL,
    description NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(20) NOT NULL DEFAULT 'reported', -- reported, in_progress, resolved, closed
    priority NVARCHAR(20) NOT NULL DEFAULT 'medium', -- low, medium, high, critical
    reported_by_user_id INT NOT NULL,
    assigned_to_user_id INT NULL,
    resolution NVARCHAR(MAX) NULL,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2 NULL,
    resolved_at DATETIME2 NULL,
    
    -- Foreign keys
    CONSTRAINT FK_issues_station FOREIGN KEY (station_id) 
        REFERENCES charging_stations(station_id),
    CONSTRAINT FK_issues_post FOREIGN KEY (post_id) 
        REFERENCES charging_posts(post_id) ON DELETE SET NULL,
    CONSTRAINT FK_issues_reported_by FOREIGN KEY (reported_by_user_id) 
        REFERENCES users(user_id),
    CONSTRAINT FK_issues_assigned_to FOREIGN KEY (assigned_to_user_id) 
        REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IX_issues_station_id ON issues(station_id);
CREATE INDEX IX_issues_post_id ON issues(post_id);
CREATE INDEX IX_issues_status ON issues(status);
CREATE INDEX IX_issues_priority ON issues(priority);
CREATE INDEX IX_issues_reported_by_user_id ON issues(reported_by_user_id);
CREATE INDEX IX_issues_assigned_to_user_id ON issues(assigned_to_user_id);
CREATE INDEX IX_issues_created_at ON issues(created_at);

GO
