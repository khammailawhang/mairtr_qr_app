import { getSupabaseServerClient } from '@/lib/supabase-server';
import {
  corsPreflight,
  getOrderDetails,
  jsonError,
  jsonSuccess,
  resolveTable,
} from '@/lib/customer-orders';

export async function OPTIONS(req) {
  return corsPreflight(req);
}

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!id || Number.isNaN(orderId)) {
      return jsonError(req, 'Invalid order id', 400);
    }

    const supabase = getSupabaseServerClient();
    const details = await getOrderDetails(supabase, orderId);

    if (!details) {
      return jsonError(req, 'Order not found', 404);
    }

    return jsonSuccess(req, details, 200);
  } catch (err) {
    return jsonError(req, err, 500);
  }
}

async function updateOrder(req, { params }) {
  try {
    const { id } = await params;
    const orderId = Number(id);

    if (!id || Number.isNaN(orderId)) {
      return jsonError(req, 'Invalid order id', 400);
    }

    const body = await req.json().catch(() => ({}));
    const supabase = getSupabaseServerClient();
    const details = await getOrderDetails(supabase, orderId);

    if (!details) {
      if (body.bill_requested === undefined) {
        return jsonError(req, 'Order not found', 404);
      }

      const tableId = body.table_id;
      if (!tableId) {
        return jsonError(req, 'Order not found', 404);
      }

      const { table, error: tableError } = await resolveTable(supabase, tableId);
      if (tableError || !table) {
        return jsonError(req, tableError || 'Table not found', tableError === 'Table not found' ? 404 : 500);
      }

      const { error: billError } = await supabase
        .from('tables')
        .update({ bill_requested: Boolean(body.bill_requested) })
        .eq('id', table.id);
      if (billError) throw billError;

      return jsonSuccess(req, { table: { ...table, bill_requested: Boolean(body.bill_requested) } }, 200);
    }

    const orderUpdates = {};
    if (typeof body.status === 'string' && body.status.trim()) {
      orderUpdates.status = body.status.trim();
    }
    if (typeof body.order_lang === 'string' && body.order_lang.trim()) {
      orderUpdates.order_lang = body.order_lang.trim();
    }
    if (body.total_price !== undefined && body.total_price !== null && !Number.isNaN(Number(body.total_price))) {
      orderUpdates.total_price = Number(body.total_price);
    }
    if (Object.keys(orderUpdates).length > 0) {
      const { error: updateError } = await supabase
        .from('orders')
        .update(orderUpdates)
        .eq('id', orderId);
      if (updateError) throw updateError;
    }

    if (body.bill_requested !== undefined) {
      const { error: billError } = await supabase
        .from('tables')
        .update({ bill_requested: Boolean(body.bill_requested) })
        .eq('id', details.order.table_id);
      if (billError) throw billError;
    }

    if (body.item_status && body.item_id) {
      const { error: itemError } = await supabase
        .from('order_items')
        .update({ item_status: body.item_status })
        .eq('id', body.item_id)
        .eq('order_id', orderId);
      if (itemError) throw itemError;
    }

    const updated = await getOrderDetails(supabase, orderId);
    return jsonSuccess(req, updated, 200);
  } catch (err) {
    return jsonError(req, err, 500);
  }
}

export async function PUT(req, context) {
  return updateOrder(req, context);
}

export async function PATCH(req, context) {
  return updateOrder(req, context);
}
