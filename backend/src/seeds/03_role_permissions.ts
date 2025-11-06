import { Knex } from "knex";

export async function seed(knex: Knex): Promise<void> {
  await knex("role_permissions").del();

  const admin = await knex('roles').where({ role_name: 'admin' }).first();
  const user = await knex('roles').where({ role_name: 'user' }).first();
  const perms = await knex('permissions').select('id', 'name');

  const adminPerms = perms.map(p => ({ role_id: admin.id, permission_id: p.id }));

  const userPerms = perms
    .filter(p => ['user_list'].includes(p.name)) // user: only list by default (change as you want)
    .map(p => ({ role_id: user.id, permission_id: p.id }));

  await knex('role_permissions').insert([...adminPerms, ...userPerms]);
}
