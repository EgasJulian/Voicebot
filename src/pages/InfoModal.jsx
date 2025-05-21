// InfoModal.js
import React from 'react';

export default function InfoModal({ show, title, content, onClose }) {
  if (!show) {
    return null;
  }

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1050, // Ensure it's above other content
      }}
      onClick={onClose} // Close modal on overlay click
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '25px', // Increased padding
          borderRadius: '8px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          width: '90%',
          maxWidth: '450px', // Max width for the modal
          color: '#072146', // Dark blue text color
          position: 'relative', // For close button positioning
        }}
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside modal content
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '10px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '1.8rem', // Larger close icon
            color: '#072146',
            cursor: 'pointer',
            lineHeight: '1'
          }}
        >
          &times;
        </button>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <span 
              style={{
                display: 'inline-block',
                backgroundColor: '#007bff', // Blue background for icon
                color: 'white',
                borderRadius: '50%',
                width: '40px', // Icon size
                height: '40px',
                lineHeight: '40px',
                fontSize: '1.5rem', // Question mark size
                fontWeight: 'bold',
                marginBottom: '10px'
              }}
            >
              ?
            </span>
            <h4 style={{ color: '#072146', fontWeight: 'bold', marginBottom: '5px' }}>{title}</h4>
        </div>
        <p style={{ fontSize: '0.95rem', lineHeight: '1.6', textAlign: 'left' }}> {/* Align text left */}
          {content}
        </p>
        <div style={{ textAlign: 'center', marginTop: '25px' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#007bff', // Blue button
              color: 'white',
              border: 'none',
              padding: '10px 25px', // Button padding
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}