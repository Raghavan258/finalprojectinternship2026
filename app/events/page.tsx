"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Search } from "lucide-react";
import EventCard, { EventData } from "@/components/EventCard";

function BrowseEventsContent() {
  const searchParams = useSearchParams();
  const catParam = searchParams.get("cat") || "";
  const qParam = searchParams.get("q") || "";

  const [events, setEvents] = useState<EventData[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventData[]>([]);
  
  // Search state
  const [searchVal, setSearchVal] = useState(qParam);
  
  // Filter states
  const [checkedCats, setCheckedCats] = useState<string[]>(catParam ? [catParam] : []);
  const [checkedPrices, setCheckedPrices] = useState<string[]>([]);
  const [checkedFormats, setCheckedFormats] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("upcoming");

  // Load all events from database on mount
  useEffect(() => {
    async function loadEvents() {
      try {
        const res = await fetch("/api/events");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Failed to load events", err);
      }
    }
    loadEvents();
  }, []);

  // Update filtered events when filters change
  useEffect(() => {
    let result = events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchVal.toLowerCase()) ||
        event.organizer.toLowerCase().includes(searchVal.toLowerCase()) ||
        event.location.toLowerCase().includes(searchVal.toLowerCase());

      const matchesCat = checkedCats.length === 0 || checkedCats.includes(event.category);
      const matchesPrice = checkedPrices.length === 0 || checkedPrices.includes(event.price);
      const matchesFormat = checkedFormats.length === 0 || checkedFormats.includes(event.format);

      return matchesSearch && matchesCat && matchesPrice && matchesFormat;
    });

    // Sorting
    if (sortBy === "popular") {
      result.sort((a, b) => b.registrationsCount - a.registrationsCount);
    } else if (sortBy === "days-left") {
      result.sort((a, b) => a.daysLeft - b.daysLeft);
    } else {
      // relevance / upcoming (id order)
      result.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }

    setFilteredEvents(result);
  }, [events, searchVal, checkedCats, checkedPrices, checkedFormats, sortBy]);

  const handleCatChange = (cat: string) => {
    setCheckedCats((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const handlePriceChange = (price: string) => {
    setCheckedPrices((prev) =>
      prev.includes(price) ? prev.filter((p) => p !== price) : [...prev, price]
    );
  };

  const handleFormatChange = (format: string) => {
    setCheckedFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  };

  const resetFilters = () => {
    setCheckedCats([]);
    setCheckedPrices([]);
    setCheckedFormats([]);
    setSearchVal("");
    setSortBy("upcoming");
  };

  return (
    <div className="container browse-layout">
      {/* Left Filter Sidebar */}
      <aside className="filter-sidebar hidden-md block-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold font-display flex items-center gap-2">
            <SlidersHorizontal style={{ width: "18px", height: "18px", color: "var(--brand-indigo-600)" }} />
            Filter Options
          </h2>
          <button type="button" className="btn btn-ghost btn-sm text-indigo" onClick={resetFilters} style={{ padding: "4px 8px" }}>
            Reset All
          </button>
        </div>

        {/* Category checkboxes */}
        <div className="filter-group">
          <h3 className="filter-title">Opportunity Category</h3>
          {[
            { value: "hackathon", label: "Hackathons" },
            { value: "workshop", label: "Workshops" },
            { value: "jobfair", label: "Job Fairs" },
            { value: "startup", label: "Startup Pitches" },
            { value: "ngo", label: "NGO Programs" },
            { value: "cultural", label: "Cultural Events" },
            { value: "healthcare", label: "Healthcare Camps" },
            { value: "volunteer", label: "Volunteer Drives" },
            { value: "scholarship", label: "Scholarships" },
            { value: "mentorship", label: "Mentorships" },
          ].map((cat) => (
            <label key={cat.value} className="filter-item">
              <input
                type="checkbox"
                value={cat.value}
                checked={checkedCats.includes(cat.value)}
                onChange={() => handleCatChange(cat.value)}
              />{" "}
              {cat.label}
            </label>
          ))}
        </div>

        {/* Price Checkboxes */}
        <div className="filter-group">
          <h3 className="filter-title">Participation Fee</h3>
          <label className="filter-item">
            <input
              type="checkbox"
              value="free"
              checked={checkedPrices.includes("free")}
              onChange={() => handlePriceChange("free")}
            />{" "}
            Free Registration
          </label>
          <label className="filter-item">
            <input
              type="checkbox"
              value="paid"
              checked={checkedPrices.includes("paid")}
              onChange={() => handlePriceChange("paid")}
            />{" "}
            Paid Registration
          </label>
        </div>

        {/* Format Checkboxes */}
        <div className="filter-group">
          <h3 className="filter-title">Event Mode</h3>
          <label className="filter-item">
            <input
              type="checkbox"
              value="online"
              checked={checkedFormats.includes("online")}
              onChange={() => handleFormatChange("online")}
            />{" "}
            Virtual / Online
          </label>
          <label className="filter-item">
            <input
              type="checkbox"
              value="offline"
              checked={checkedFormats.includes("offline")}
              onChange={() => handleFormatChange("offline")}
            />{" "}
            In-Person / Offline
          </label>
        </div>
      </aside>

      {/* Main Opportunity Listing */}
      <div>
        <div className="top-bar">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-display" style={{ margin: 0 }}>
              <span className="text-indigo">{filteredEvents.length}</span> Opportunities Available
            </h1>
          </div>
          <div className="flex gap-3 flex-wrap items-center">
            <div className="search-input-wrap">
              <Search />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="search-input"
                placeholder="Search title, location, or organizer..."
              />
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="upcoming">Relevance (Default)</option>
              <option value="popular">Most Popular</option>
              <option value="days-left">Closing Soon First</option>
            </select>
          </div>
        </div>

        {/* Listings Grid */}
        <div className="event-grid">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => <EventCard key={event.id} event={event} />)
          ) : (
            <div
              className="col-span-full text-center py-16 card card-flat bg-surface"
              style={{ borderStyle: "dashed", borderWidth: "2px" }}
            >
              <p className="text-muted text-lg mb-2">No matching events found.</p>
              <p className="text-sm text-secondary">Try updating your filters or search keywords.</p>
              <button className="btn btn-outline btn-sm mt-4" onClick={resetFilters}>
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowseEvents() {
  return (
    <Suspense fallback={<div>Loading opportunities...</div>}>
      <BrowseEventsContent />
    </Suspense>
  );
}
