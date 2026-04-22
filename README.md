# Lost & Found

A student-focused web application for posting lost and found items, submitting ownership claims, and helping return belongings to their rightful owners through a simple, secure, and user-friendly platform.

## Overview

**Lost & Found** is a full-stack web application built with **Angular** on the frontend and **Django REST Framework** on the backend.

It solves a real problem inside a university environment: students often lose personal belongings, while others may find them but have no convenient, organized way to return them. The platform allows users to:

- create posts for lost items and found items
- browse and search existing posts
- submit ownership claims for found items
- manage the status of items and claims
- authenticate securely and access personalized data

## Problem Statement

In universities, lost items are usually handled chaotically through group chats, word of mouth, or physical lost-and-found desks. These methods are slow, unstructured, and unreliable.

This project provides a centralized digital system where:

- students can post lost items
- students or staff can post found items
- owners can claim found items
- posters can review claims and mark items as resolved

## Core Features

### Authentication
- User registration, login, and logout
- JWT access and refresh token flow
- Protected routes and pages

### Lost/Found Item Management
- Create, view, edit, and delete item posts
- Mark items as resolved

### Claim System
- Submit a claim for a found item with an explanatory message
- View all claims related to a user's item
- Approve or reject claims

### Filtering and Browsing
- Filter by item type (lost or found), category, and status
- Search by title or description

### User Dashboard
- View own posts, submitted claims, and claims received on own items

## Target Users

- Students
- University staff

## Tech Stack

### Frontend
- Angular
- TypeScript
- Angular Router, FormsModule, HttpClient

### Backend
- Python
- Django
- Django REST Framework
- Simple JWT
- django-cors-headers
- SQLite (development)

## Domain Model

- **User** — authenticated account (Django built-in)
- **Category** — item category (e.g., Electronics, Documents, Clothing)
- **Item** — a lost or found post, owned by a user and belonging to a category
- **Claim** — a user's ownership request for a found item

## Team

- Yergali Ussibaliyev
- Temirlan Tazhibayev
- Nursat Tairuly
