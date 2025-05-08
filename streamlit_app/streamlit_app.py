import streamlit as st
import pandas as pd
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from db.db_config import engine 
from etl.transform import clean_leads

# Set the Streamlit page configuration
st.set_page_config(page_title="CRM Lead Manager", layout="centered")
st.title("Personal CRM: Lead & Customer Manager")

# Create two tabs: one for adding leads, one for promoting to customer
tab1, tab2, tab3 = st.tabs(["Add Lead", "Convert to Customer", "View & Edit Lead"])


# -------- TAB 1: Add New Lead --------
with tab1:
    st.subheader("New Lead")

    # Form input for lead details
    with st.form("lead_form"):
        name = st.text_input("Name")
        company_name = st.text_input("Company Name")
        email = st.text_input("Email")
        telegram = st.text_input("Telegram")
        phone_number = st.text_input("Phone Number")
        linkedin_url = st.text_input("Linkedin URL")
        source = st.selectbox("Source", ["LinkedIn", "Event", "Referral", "Cold Email", "Other"])
        country = st.text_input("Country")
        bd_in_charge = st.selectbox("BD", ["Patrick", "Ethan", "John", "Dylise"])
        background = st.text_input("Background")
        create_lead = st.form_submit_button("Create Lead")

        if create_lead:
            # Construct a DataFrame for insertion
            lead_data = pd.DataFrame([{
                "full_name": name,
                "email": email,
                "telegram": telegram,
                "phone_number": phone_number,
                "status": '1. lead generated', # Default status
                "source": source,
                "country": country,
                "company_name": company_name,
                "linkedin_url": linkedin_url,
                "bd_in_charge": bd_in_charge,
                "background": background
            }])
            try:
                # Clean the data
                clean_lead_data = clean_leads(lead_data)
                # Append new lead to the "leads" table in PostgreSQL
                clean_lead_data.to_sql("lead", engine, if_exists="append", index=False)
                st.success("Lead saved successfully!")
            except Exception as e:
                st.error(f"Error saving lead: {e}")


# -------- TAB 2: Promote Lead to Customer --------
with tab2:
    st.subheader("Promote Existing Lead to Customer")

    try:
        # Read leads and customers from the database
        with engine.connect() as conn:
            leads_df = pd.read_sql("SELECT lead_id,full_name, email, company_name FROM lead", conn)
            customers_df = pd.read_sql("SELECT lead_id FROM customer", conn)

        # Filter leads that haven't been converted to customers yet
        existing_customer_ids = customers_df["lead_id"].tolist()
        available_leads = leads_df[~leads_df["lead_id"].isin(existing_customer_ids)]

        if not available_leads.empty:
            # Create user-friendly dropdown options
            available_leads["display"] = available_leads["full_name"] + " | " + available_leads["email"]
            selected = st.selectbox("Select Lead", available_leads["display"])
            selected_row = available_leads[available_leads["display"] == selected].iloc[0]

            # Input for customer status or notes
            notes = st.text_area("Customer Notes / Status")
            submit_customer = st.button("Promote to Customer")

            if submit_customer:
                customer_data = pd.DataFrame([{
                    "lead_id": selected_row["lead_id"],
                    "status": notes
                }])
                try:
                    # Insert into "customers" table
                    customer_data.to_sql("customers", engine, if_exists="append", index=False)
                    st.success("✅ Customer created successfully!")
                except Exception as e:
                    st.error(f"❌ Error promoting to customer: {e}")
        else:
            st.info("✅ All leads have already been converted to customers.")
    
    except Exception as err:
        st.error(f"❌ Failed to load leads or customers: {err}")

# -------- TAB 3: View and Edit Lead Details --------
with tab3:
    st.subheader("View & Edit Leads")

    # Load leads from DB
    with engine.connect() as conn:
        leads_df = pd.read_sql("SELECT * FROM lead", conn)

    if not leads_df.empty:
        # Search box
        search = st.text_input("Search by name, email, or company")

        # Filter rows based on search
        mask = (
            leads_df["full_name"].str.contains(search, case=False, na=False) |
            leads_df["email"].str.contains(search, case=False, na=False) |
            leads_df["company_name"].str.contains(search, case=False, na=False)
        )
        filtered_df = leads_df[mask].copy()

        # Keep a copy of original filtered data
        original_df = filtered_df.copy()

        # Editable table
        edited_df = st.data_editor(
            filtered_df,
            num_rows="dynamic",
            use_container_width=True,
            key="leads_editor"
        )

        if st.button("Save Changes"):
            changed_rows = edited_df[edited_df != original_df].dropna(how="all")

            if not changed_rows.empty:
                with engine.begin() as conn:
                    for index in changed_rows.index:
                        row = edited_df.loc[index]
                        update_query = """
                            UPDATE lead
                            SET
                                full_name = %(full_name)s,
                                email = %(email)s,
                                telegram = %(telegram)s,
                                phone_number = %(phone_number)s,
                                status = %(status)s,
                                source = %(source)s,
                                company_name = %(company_name)s,
                                linkedin_url = %(linkedin_url)s,
                                bd_in_charge = %(bd_in_charge)s
                            WHERE lead_id = %(lead_id)s;
                        """
                        conn.execute(update_query, row.to_dict())
                st.success("✅ Changes saved to database!")
            else:
                st.info("No changes to save.")
    else:
        st.info("No leads found in the database.")