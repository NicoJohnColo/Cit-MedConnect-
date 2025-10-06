import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DateTimePicker = ({ selected, onChange, minDate, maxDate, placeholderText, showTimeSelect = true, timeFormat = 'HH:mm', timeIntervals = 30, dateFormat = 'MMMM d, yyyy h:mm aa', ...props }) => {
  return (
    <div className="date-time-picker">
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect={showTimeSelect}
        timeFormat={timeFormat}
        timeIntervals={timeIntervals}
        dateFormat={dateFormat}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholderText || 'Select date and time'}
        className="form-control"
        wrapperClassName="w-100"
        calendarClassName="date-picker-calendar"
        timeClassName={time => 'time-picker-option'}
        {...props}
      />
      <style jsx global>{`
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .react-datepicker__header {
          background-color: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          border-top-left-radius: 0.5rem;
          padding: 0.5rem 0;
        }
        .react-datepicker__current-month,
        .react-datepicker-time__header,
        .react-datepicker__day-name,
        .react-datepicker__day,
        .react-datepicker__time-name {
          color: #1a202c;
        }
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected,
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box ul.react-datepicker__time-list li.react-datepicker__time-list-item--selected {
          background-color: #8a1b1b;
          color: white;
        }
        .react-datepicker__day:hover,
        .react-datepicker__time-list-item:hover {
          background-color: #f1f5f9;
        }
        .react-datepicker__time-container .react-datepicker__time .react-datepicker__time-box {
          width: 100px;
        }
        .react-datepicker__time-list {
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default DateTimePicker;
